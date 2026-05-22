const OPENAI_BEST_QUALITY_REALTIME_VOICES = new Set(["marin", "cedar"]);

export function mapRealtimeVoice(voice: string): string {
  const normalized = String(voice || "").trim().toLowerCase();
  return OPENAI_BEST_QUALITY_REALTIME_VOICES.has(normalized) ? normalized : "marin";
}

export function resolveRealtimeVoice(voice: string, gender?: string): string {
  const normalizedVoice = String(voice || "").trim().toLowerCase();
  const normalizedGender = String(gender || "").trim().toLowerCase();

  if (OPENAI_BEST_QUALITY_REALTIME_VOICES.has(normalizedVoice)) return normalizedVoice;
  if (normalizedGender === "male") return "cedar";

  return "marin";
}
