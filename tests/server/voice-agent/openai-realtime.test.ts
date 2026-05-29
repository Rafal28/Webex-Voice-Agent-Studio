import assert from "node:assert/strict";

import { OpenAIRealtimeClient, type RealtimeSessionConfig } from "../../../server/voice-agent/openai-realtime";

const config: RealtimeSessionConfig = {
  instructions: "test",
  inputAudioFormat: "pcm16",
  outputAudioFormat: "pcm16",
};

const client = new OpenAIRealtimeClient("test-key", config);
const handleEvent = (client as unknown as { handleEvent(event: any): void }).handleEvent.bind(client);
const transcripts: string[] = [];

client.on("assistantTranscriptDone", (text: string) => {
  transcripts.push(text);
});

handleEvent({ type: "response.created", response: { id: "response-1" } });
handleEvent({
  type: "response.audio_transcript.done",
  transcript: "Hi, thanks for calling Acme Electronics.",
});
handleEvent({
  type: "response.output_audio_transcript.done",
  transcript: "Hi, thanks for calling Acme Electronics.",
});
handleEvent({
  type: "response.output_text.done",
  text: "Hi, thanks for calling Acme Electronics!",
});

assert.deepEqual(transcripts, ["Hi, thanks for calling Acme Electronics."]);

handleEvent({
  type: "response.output_text.done",
  text: "I can help with product availability.",
});

assert.deepEqual(transcripts, [
  "Hi, thanks for calling Acme Electronics.",
  "I can help with product availability.",
]);

handleEvent({ type: "response.created", response: { id: "response-2" } });
handleEvent({
  type: "response.output_audio_transcript.done",
  transcript: "Hi, thanks for calling Acme Electronics.",
});

assert.deepEqual(transcripts, [
  "Hi, thanks for calling Acme Electronics.",
  "I can help with product availability.",
  "Hi, thanks for calling Acme Electronics.",
]);

console.log("openai realtime transcript dedupe regression passed");
