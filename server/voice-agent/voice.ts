const OPENAI_REALTIME_VOICE_MAP: Record<string, string> = {
  alloy: "alloy",
  echo: "echo",
  fable: "ash",
  nova: "shimmer",
  onyx: "echo",
  shimmer: "shimmer",
  "aura-asteria-en": "shimmer",
  "aura-luna-en": "shimmer",
  "aura-stella-en": "shimmer",
  "aura-athena-en": "shimmer",
  "aura-hera-en": "shimmer",
  "aura-orion-en": "echo",
  "aura-arcas-en": "ash",
  "aura-perseus-en": "echo",
  "aura-angus-en": "verse",
  "aura-orpheus-en": "ash",
  "aura-helios-en": "echo",
  "aura-zeus-en": "echo",
};

const VALID_OPENAI_REALTIME_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
]);

const GENDER_FALLBACK_VOICE_IDS = new Set(["", "alloy", "verse"]);

export function mapRealtimeVoice(voice: string): string {
  const normalized = String(voice || "").trim().toLowerCase();
  if (VALID_OPENAI_REALTIME_VOICES.has(normalized)) return normalized;
  return OPENAI_REALTIME_VOICE_MAP[normalized] || "verse";
}

export function resolveRealtimeVoice(voice: string, gender?: string): string {
  const normalizedVoice = String(voice || "").trim().toLowerCase();
  const normalizedGender = String(gender || "").trim().toLowerCase();
  const hasKnownVoice =
    OPENAI_REALTIME_VOICE_MAP[normalizedVoice] ||
    VALID_OPENAI_REALTIME_VOICES.has(normalizedVoice);

  if (GENDER_FALLBACK_VOICE_IDS.has(normalizedVoice) || !hasKnownVoice) {
    if (normalizedGender === "female") return "shimmer";
    if (normalizedGender === "male") return "echo";
  }

  return mapRealtimeVoice(voice);
}
