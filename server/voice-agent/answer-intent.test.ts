import assert from "node:assert/strict";
import { classifyFinalCheckInAnswer, isNoMoreHelpAnswerTranscript } from "./answer-intent";

const negativeAnswers = [
  "No, that's all good, thank you.",
  "nah I'm all set",
  "No thanks, I'm good.",
  "I'm good for now",
  "That should do it",
  "Nothing else",
  "I don't need anything else",
  "thank you, that's all",
  "yeah no I'm good",
  "not right now",
  "No, I think that's possible.",
  "No, I think we're good.",
  "No, I'll pass.",
];

const positiveAnswers = [
  "Yes, can you check another iPad?",
  "Actually I have one more question",
  "No, can you also send the confirmation?",
  "Sure, I need a case too",
  "Can you look up the Pro model?",
  "I do have another question",
  "one more thing",
  "What about a keyboard?",
  "also, could you check Palo Alto?",
  "No, I think I need the case too.",
  "No, but can you check another pickup time?",
  "No, I still need help with the keyboard.",
];

for (const answer of negativeAnswers) {
  assert.equal(classifyFinalCheckInAnswer(answer), "negative", answer);
  assert.equal(isNoMoreHelpAnswerTranscript(answer), true, answer);
}

for (const answer of positiveAnswers) {
  assert.equal(classifyFinalCheckInAnswer(answer), "positive", answer);
  assert.equal(isNoMoreHelpAnswerTranscript(answer), false, answer);
}
