import assert from "node:assert/strict";
import {
  classifyAddOnOfferAnswer,
  classifyFinalCheckInAnswer,
  isAssistantAddOnOfferTranscript,
  isAssistantWaitingForCallerAnswerTranscript,
  isCombinedAddOnAndFinalCheckInTranscript,
  isIncompleteUserRequestTranscript,
  isNoMoreHelpAnswerTranscript,
  isStandaloneFinalCheckInTranscript,
} from "./answer-intent";

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
  "Not really. How about on Tuesday at four o'clock?",
  "No, how about Palo Alto instead?",
  "No, Tuesday at 4 PM would work better.",
  "Yeah, I mean I said I want to pick it up on Tuesday at 4 o'clock.",
];

for (const answer of negativeAnswers) {
  assert.equal(classifyFinalCheckInAnswer(answer), "negative", answer);
  assert.equal(isNoMoreHelpAnswerTranscript(answer), true, answer);
}

for (const answer of positiveAnswers) {
  assert.equal(classifyFinalCheckInAnswer(answer), "positive", answer);
  assert.equal(isNoMoreHelpAnswerTranscript(answer), false, answer);
}

const combinedAddOnAndCheckIn =
  "In our previous conversations you mentioned this is a birthday gift for your daughter and that she loves purple — would you like me to add a Purple Protective Case to go along with it? Is there anything else I can help with?";

assert.equal(isAssistantAddOnOfferTranscript(combinedAddOnAndCheckIn), true);
assert.equal(isCombinedAddOnAndFinalCheckInTranscript(combinedAddOnAndCheckIn), true);
assert.equal(isStandaloneFinalCheckInTranscript(combinedAddOnAndCheckIn), false);
assert.equal(isStandaloneFinalCheckInTranscript("Is there anything else I can help with?"), true);
assert.equal(
  isStandaloneFinalCheckInTranscript("Nice. The case will pair well with the iPad for the gift. Is there anything else I can help with?"),
  true
);

assert.equal(
  isAssistantWaitingForCallerAnswerTranscript(
    "For the iPad mini, the option available in our catalog is Silver. If you’d like, I can check availability at your preferred pickup store next."
  ),
  true
);
assert.equal(isAssistantWaitingForCallerAnswerTranscript("I can check availability at your preferred pickup store next."), true);
assert.equal(isAssistantWaitingForCallerAnswerTranscript("I can have it ready for pickup tomorrow at 2 PM. Would that work?"), true);
assert.equal(isAssistantWaitingForCallerAnswerTranscript("The iPad mini is available in Silver."), false);

assert.equal(isIncompleteUserRequestTranscript("Hello, I'd like to"), true);
assert.equal(isIncompleteUserRequestTranscript("I'd like to"), true);
assert.equal(isIncompleteUserRequestTranscript("I was calling about"), true);
assert.equal(isIncompleteUserRequestTranscript("Hi, I was calling about a few tablet options."), false);
assert.equal(isIncompleteUserRequestTranscript("I'd like to buy an iPad."), false);

const addOnDeclines = [
  "No, I think I'm good. I'm not interested in that.",
  "not interested",
  "I'll pass",
  "I'm good",
  "No thanks, don't add that.",
  "Leave it off.",
];

const addOnAccepts = [
  "Yes, please add it.",
  "I'm interested in that.",
  "Sure, include it.",
  "That sounds good.",
  "I'll take it.",
];

for (const answer of addOnDeclines) {
  assert.equal(classifyAddOnOfferAnswer(answer), "negative", answer);
}

for (const answer of addOnAccepts) {
  assert.equal(classifyAddOnOfferAnswer(answer), "positive", answer);
}
