import assert from "node:assert/strict";

import { OpenAIRealtimeClient } from "./openai-realtime";

function createClient(): OpenAIRealtimeClient {
  return new OpenAIRealtimeClient("test-key", {
    instructions: "test",
    inputAudioFormat: "g711_ulaw",
    outputAudioFormat: "g711_ulaw",
  });
}

function emitRealtimeEvent(client: OpenAIRealtimeClient, event: Record<string, unknown>): void {
  (client as unknown as { handleEvent: (event: Record<string, unknown>) => void }).handleEvent(event);
}

function captureOutboundEvents(client: OpenAIRealtimeClient): unknown[] {
  const events: unknown[] = [];
  (client as unknown as { ws: { readyState: number; send: (payload: string) => void } | null }).ws = {
    readyState: 1,
    send: (payload: string) => events.push(JSON.parse(payload)),
  };
  return events;
}

const transcriptFallbackClient = createClient();
const emittedTranscripts: string[] = [];
transcriptFallbackClient.on("assistantTranscriptDone", (text) => emittedTranscripts.push(text));

emitRealtimeEvent(transcriptFallbackClient, { type: "response.created", response: { id: "response-1" } });
emitRealtimeEvent(transcriptFallbackClient, {
  type: "response.done",
  response: {
    id: "response-1",
    output: [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "audio", transcript: "I found that item in Palo Alto." }],
      },
    ],
  },
});

assert.deepEqual(emittedTranscripts, ["I found that item in Palo Alto."]);

const noDuplicateClient = createClient();
const noDuplicateTranscripts: string[] = [];
noDuplicateClient.on("assistantTranscriptDone", (text) => noDuplicateTranscripts.push(text));

emitRealtimeEvent(noDuplicateClient, { type: "response.created", response: { id: "response-2" } });
emitRealtimeEvent(noDuplicateClient, {
  type: "response.audio_transcript.done",
  transcript: "Already emitted.",
});
emitRealtimeEvent(noDuplicateClient, {
  type: "response.done",
  response: {
    id: "response-2",
    output: [
      {
        type: "message",
        role: "assistant",
        content: [{ type: "audio", transcript: "Already emitted." }],
      },
    ],
  },
});

assert.deepEqual(noDuplicateTranscripts, ["Already emitted."]);

const deferredToolClient = createClient();
const outboundEvents = captureOutboundEvents(deferredToolClient);

emitRealtimeEvent(deferredToolClient, { type: "response.created", response: { id: "response-3" } });
deferredToolClient.sendFunctionOutput("call_123", JSON.stringify({ success: true }));

assert.deepEqual(outboundEvents, [
  {
    type: "conversation.item.create",
    item: {
      type: "function_call_output",
      call_id: "call_123",
      output: JSON.stringify({ success: true }),
    },
  },
]);

emitRealtimeEvent(deferredToolClient, { type: "response.done", response: { id: "response-3", output: [] } });

assert.deepEqual(outboundEvents[1], { type: "response.create" });

console.log("OpenAI Realtime wrapper regression passed");
