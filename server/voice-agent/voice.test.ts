import assert from "node:assert/strict";
import { mapRealtimeVoice, resolveRealtimeVoice } from "./voice";

assert.equal(mapRealtimeVoice("nova"), "shimmer");
assert.equal(mapRealtimeVoice("onyx"), "echo");
assert.equal(mapRealtimeVoice("fable"), "ash");
assert.equal(mapRealtimeVoice("verse"), "verse");
assert.equal(mapRealtimeVoice(" aura-luna-en "), "shimmer");
assert.equal(mapRealtimeVoice("aura-athena-en"), "shimmer");
assert.equal(mapRealtimeVoice("unknown-legacy-voice"), "verse");

assert.equal(resolveRealtimeVoice("nova", "female"), "shimmer");
assert.equal(resolveRealtimeVoice("verse", "female"), "shimmer");
assert.equal(resolveRealtimeVoice("verse", "male"), "echo");
assert.equal(resolveRealtimeVoice("verse", "neutral"), "verse");
assert.equal(resolveRealtimeVoice("unknown-legacy-voice", "female"), "shimmer");
assert.equal(resolveRealtimeVoice("shimmer", "male"), "shimmer");
