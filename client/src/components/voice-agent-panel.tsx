import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useVoiceAgent, type VoiceAgentState, type TranscriptEntry } from "@/hooks/use-voice-agent";

interface VoiceAgentPanelProps {
  agentId: number;
  agentName: string;
  systemPrompt?: string;
  voice?: string;
}

export function VoiceAgentPanel({ agentId, agentName, systemPrompt, voice }: VoiceAgentPanelProps) {
  const { state, transcript, assistantPartial, error, start, stop } = useVoiceAgent({
    agentId,
    systemPrompt,
    voice,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, assistantPartial]);

  const isActive = state !== "idle";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Voice Call</span>
        </div>
        <StatusBadge state={state} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Mic className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Start a real-time voice call with {agentName}
            </p>
          </div>
        )}

        {transcript.length === 0 && isActive && state === "connecting" && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting...</p>
          </div>
        )}

        {transcript.length === 0 && isActive && state === "listening" && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">Listening... speak now</p>
          </div>
        )}

        {transcript.map((entry, i) => (
          <TranscriptBubble key={i} entry={entry} agentName={agentName} />
        ))}

        {assistantPartial && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 border border-primary/50 shrink-0">
              <AvatarFallback className="bg-primary text-black text-xs font-bold">
                {agentName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1">{agentName}</div>
              <div className="p-3 rounded-xl rounded-tl-none bg-white/5 border border-white/10 text-sm">
                {assistantPartial}
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        {!isActive ? (
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={start}
          >
            <Phone className="w-4 h-4" />
            Start Call
          </Button>
        ) : (
          <Button
            className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={stop}
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: VoiceAgentState }) {
  switch (state) {
    case "idle":
      return null;
    case "connecting":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Connecting
        </Badge>
      );
    case "listening":
      return (
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Listening
        </Badge>
      );
    case "speaking":
      return (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs gap-1">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" /> Speaking
        </Badge>
      );
  }
}

function TranscriptBubble({ entry, agentName }: { entry: TranscriptEntry; agentName: string }) {
  const isUser = entry.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className={`h-8 w-8 border shrink-0 ${isUser ? "border-purple-500/50" : "border-primary/50"}`}>
        <AvatarFallback className={`text-xs font-bold ${isUser ? "bg-purple-500 text-white" : "bg-primary text-black"}`}>
          {isUser ? "U" : agentName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
        <div className="text-xs text-muted-foreground mb-1">
          {isUser ? "You" : agentName}
        </div>
        <div className={`inline-block p-3 rounded-xl text-sm max-w-[85%] ${
          isUser
            ? "rounded-tr-none bg-purple-500/10 border border-purple-500/20 text-left"
            : "rounded-tl-none bg-white/5 border border-white/10"
        }`}>
          {entry.text}
        </div>
      </div>
    </div>
  );
}
