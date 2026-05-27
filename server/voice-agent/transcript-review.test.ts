import assert from "node:assert/strict";

import {
  reviewEnglishUserTranscript,
  shouldSuppressBrowserUserTranscript,
  shouldSuppressTwilioUserTranscript,
} from "./index";

const originalApiKey = process.env.OPENAI_API_KEY;
const originalFetch = globalThis.fetch;
const originalDateNow = Date.now;

try {
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response("upstream unavailable", { status: 500 })) as typeof fetch;

  const failedCorrectionResult = await reviewEnglishUserTranscript("Palo Alto", {
    agentName: "Store Assistant",
    lastAssistantTranscript: "Which store would you like to pick up from, San Jose, Palo Alto, or Fremont?",
  });

  assert.deepEqual(failedCorrectionResult, {
    action: "keep",
    text: "Palo Alto",
  });

  delete process.env.OPENAI_API_KEY;
  const missingKeyResult = await reviewEnglishUserTranscript("iPad Air", {
    agentName: "Store Assistant",
    lastAssistantTranscript: "Which one would you like, the iPad Air or the iPad Pro?",
  });

  assert.deepEqual(missingKeyResult, {
    action: "keep",
    text: "iPad Air",
  });

  const localSuppressionResult = await reviewEnglishUserTranscript("morcelemoscrat", {
    agentName: "Store Assistant",
    lastAssistantTranscript: "How can I help you today?",
  });

  assert.deepEqual(localSuppressionResult, {
    action: "suppress",
    text: "",
  });

  Date.now = () => 100_000;
  const assistantContext = {
    lastAssistantAudioAt: 99_000,
    lastAssistantDoneAt: 99_000,
    lastAssistantTranscript: "The iPad Air is available at our Palo Alto store.",
  };
  const constrainedAssistantContext = {
    ...assistantContext,
    lastAssistantTranscript: "Which one would you like, the iPad Air or the iPad Pro?",
  };

  const twilioEchoSuppressed = shouldSuppressTwilioUserTranscript("The iPad Air is available", {
    ...assistantContext,
    twilioResponseActive: true,
  });
  const browserEchoSuppressed = shouldSuppressBrowserUserTranscript("The iPad Air is available", {
    ...assistantContext,
    browserPlaybackActive: false,
    responseActive: true,
  });
  assert.equal(twilioEchoSuppressed, true);
  assert.equal(browserEchoSuppressed, twilioEchoSuppressed);

  const twilioShortAnswerSuppressed = shouldSuppressTwilioUserTranscript("iPad Air", {
    ...constrainedAssistantContext,
    twilioResponseActive: false,
  });
  const browserShortAnswerSuppressed = shouldSuppressBrowserUserTranscript("iPad Air", {
    ...constrainedAssistantContext,
    browserPlaybackActive: false,
    responseActive: false,
  });
  assert.equal(twilioShortAnswerSuppressed, false);
  assert.equal(browserShortAnswerSuppressed, twilioShortAnswerSuppressed);

  const twilioGreetingSuppressed = shouldSuppressTwilioUserTranscript("hello", {
    ...assistantContext,
    twilioResponseActive: true,
  });
  const browserGreetingSuppressed = shouldSuppressBrowserUserTranscript("hello", {
    ...assistantContext,
    browserPlaybackActive: true,
    responseActive: false,
  });
  assert.equal(twilioGreetingSuppressed, true);
  assert.equal(browserGreetingSuppressed, twilioGreetingSuppressed);
} finally {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }
  globalThis.fetch = originalFetch;
  Date.now = originalDateNow;
}

console.log("transcript review fallback regression passed");
