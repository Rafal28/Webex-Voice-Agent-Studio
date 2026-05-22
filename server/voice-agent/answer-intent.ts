export type FinalCheckInAnswerIntent = "negative" | "positive" | "unknown";

function normalizeAnswerText(text: string): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[.!?,\s]+$/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripLeadingDiscourseMarkers(text: string): string {
  let normalized = text;
  const markerPattern = /^(uh|um|hm|hmm|well|so|okay|ok|alright|right|cool|great|perfect|thanks|thank you|yes|yeah|yep|yup|sure|actually)\s+(.+)$/;
  while (true) {
    const next = normalized.replace(markerPattern, "$2").trim();
    if (next === normalized) return normalized;
    normalized = next;
  }
}

function hasAdditionalHelpRequest(text: string): boolean {
  if (!text) return false;
  if (/\b(dont|do not|no need|not now|not right now)\b.*\b(need|want|have|anything|something|else|more)\b/.test(text)) {
    return false;
  }
  return (
    /^(yes|yeah|yep|yup|sure|please|absolutely|definitely|i do|we do|i have|we have|there is|theres|there are)\b/.test(text) ||
    /^(can|could|would|will)\s+you\b/.test(text) ||
    /^(i|we)\s+(still\s+)?(need|want|would like|have|am looking for|are looking for|am looking|are looking)\b/.test(text) ||
    /^(help me|show me|tell me|find|look up|check|reserve|add|change|cancel|send)\b/.test(text) ||
    /^(do you have|is there|are there|what about|how about)\b/.test(text) ||
    /\b(one more thing|another thing|something else|one question|quick question|another question|i have a question|i have another question)\b/.test(text) ||
    /\b(also|actually)\b.*\b(can|could|would|need|want|looking|check|find|show|reserve|add|change|send)\b/.test(text) ||
    /^(no|nope|nah)\s+(but\s+|actually\s+)?((can|could|would|will)\s+you|i\s+(need|want|would like|have)|we\s+(need|want|would like|have))\b/.test(text)
  );
}

function isNegativeNoMoreHelpAnswer(text: string): boolean {
  if (!text) return false;
  return (
    /^(no|nope|nah|not really|no worries)$/.test(text) ||
    /^(no|nope|nah)\s+(thanks|thank you)\s+(im|i am)\s+(good|okay|ok|fine|all good|all set)(\s+(thanks|thank you))?$/.test(text) ||
    /^(no|nope|nah)\s+(thanks|thank you)\s+(thats all|that is all|thats it|that is it|all good|nothing else)$/.test(text) ||
    /^(no|nope|nah)\s+(thanks|thank you|im good|i am good|im okay|i am okay|im ok|i am ok|im fine|i am fine|im all good|i am all good|im all set|i am all set|all good|all set|thats all|that is all|thats all good|that is all good|thats it|that is it|that should do it|thatll do it|nothing else|not right now|not at the moment|not today|no more|no more questions)(\s+(thanks|thank you))?$/.test(text) ||
    /^(all good|all set|im good|i am good|im okay|i am okay|im ok|i am ok|im fine|i am fine|im all good|i am all good|im all set|i am all set|were good|we are good|were all set|we are all set)(\s+(for now|thanks|thank you))?$/.test(text) ||
    /^(thats all|that is all|thats it|that is it|thats everything|that is everything|that should do it|thatll do it|that will do it|that does it|that should be all|that should be it|this is all|this is it)(\s+(thanks|thank you))?$/.test(text) ||
    /^(nothing else|nothing more|no more questions|no other questions|no further questions|not right now|not at the moment|not today|not for now)$/.test(text) ||
    /^(i|we)\s+(dont|do not)\s+(need|want|have)\s+(anything|something)?\s*(else|more|right now|at the moment|today)?$/.test(text) ||
    /^(i think|i believe|i guess)?\s*(thats all|that is all|thats it|that is it|were good|we are good|im good|i am good|im all set|i am all set)$/.test(text) ||
    /^(thanks|thank you|appreciate it|thanks a lot|thank you so much)(\s+(thats all|that is all|im good|i am good|im all set|i am all set))?$/.test(text)
  );
}

export function classifyFinalCheckInAnswer(text: string): FinalCheckInAnswerIntent {
  const normalized = normalizeAnswerText(text);
  if (!normalized) return "unknown";
  const stripped = stripLeadingDiscourseMarkers(normalized);

  if (isNegativeNoMoreHelpAnswer(stripped) || isNegativeNoMoreHelpAnswer(normalized)) {
    return "negative";
  }
  if (hasAdditionalHelpRequest(stripped) || hasAdditionalHelpRequest(normalized)) {
    return "positive";
  }
  return "unknown";
}

export function isNoMoreHelpAnswerTranscript(text: string): boolean {
  return classifyFinalCheckInAnswer(text) === "negative";
}
