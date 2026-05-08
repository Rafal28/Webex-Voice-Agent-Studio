import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceAgentState = "idle" | "connecting" | "listening" | "speaking";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface UseVoiceAgentOptions {
  agentId?: number;
  systemPrompt?: string;
  voice?: string;
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}) {
  const [state, setState] = useState<VoiceAgentState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [assistantPartial, setAssistantPartial] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const processorSinkRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const clearPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try { src.stop(); } catch {}
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      setState("connecting");
      setTranscript([]);
      setAssistantPartial("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 24000 },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      nextPlayTimeRef.current = audioContext.currentTime;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      const processorSink = audioContext.createGain();
      processorSink.gain.value = 0;
      workletNodeRef.current = processor;
      processorSinkRef.current = processorSink;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/voice-agent`);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "start",
          agentId: options.agentId,
          config: { systemPrompt: options.systemPrompt, voice: options.voice },
        }));
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          playAudioChunk(event.data);
        } else {
          handleEvent(JSON.parse(event.data));
        }
      };

      ws.onclose = () => {
        setState("idle");
        cleanup();
      };

      ws.onerror = () => {
        setError("Connection failed. Check that OPENAI_API_KEY is configured.");
        setState("idle");
        cleanup();
      };

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        ws.send(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(processorSink);
      processorSink.connect(audioContext.destination);
    } catch (err: any) {
      setError(err.message || "Failed to start voice agent");
      setState("idle");
    }
  }, [options.agentId, options.systemPrompt, options.voice]);

  const stop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      wsRef.current.close();
    }
    cleanup();
    setState("idle");
  }, []);

  function handleEvent(msg: any): void {
    switch (msg.type) {
      case "connected":
        setState("listening");
        break;
      case "interruptClear":
        clearPlayback();
        setAssistantPartial("");
        break;
      case "speechStarted":
        setState("speaking");
        break;
      case "userTranscript":
        appendTranscript("user", msg.text);
        setState("listening");
        break;
      case "assistantTranscriptDelta":
        setAssistantPartial((prev) => prev + msg.delta);
        setState("speaking");
        break;
      case "assistantTranscriptDone":
        appendTranscript("assistant", msg.text);
        setAssistantPartial("");
        break;
      case "responseDone":
        setState("listening");
        break;
      case "error":
        setError(msg.message);
        break;
    }
  }

  function appendTranscript(role: TranscriptEntry["role"], text: string): void {
    const cleaned = (text || "").trim();
    if (!cleaned) return;

    const normalized = cleaned.toLowerCase().replace(/[.!?,\s]+$/g, "");
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      const lastNormalized = last?.text.toLowerCase().replace(/[.!?,\s]+$/g, "");
      if (last?.role === role && lastNormalized === normalized) return prev;
      return [...prev, { role, text: cleaned, timestamp: Date.now() }];
    });
  }

  function playAudioChunk(arrayBuffer: ArrayBuffer): void {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
    }
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gainNodeRef.current);
    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    src.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
    activeSourcesRef.current.push(src);
    src.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== src);
    };
  }

  function cleanup(): void {
    clearPlayback();
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    processorSinkRef.current?.disconnect();
    processorSinkRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    gainNodeRef.current?.disconnect();
    gainNodeRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    nextPlayTimeRef.current = 0;
    wsRef.current = null;
  }

  useEffect(() => () => cleanup(), []);

  return { state, transcript, assistantPartial, error, start, stop };
}
