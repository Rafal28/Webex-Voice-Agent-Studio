interface WhatsAppOptInEnv {
  [key: string]: string | undefined;
}

export interface WhatsAppOptInConfig {
  configured: boolean;
  sandboxNumber: string;
  joinCode: string;
  joinMessage: string;
  whatsAppUrl: string;
}

export function normalizeWhatsAppNumber(value?: string): string {
  const trimmed = String(value || "").trim();
  return trimmed.replace(/^whatsapp:/i, "");
}

export function buildWhatsAppOptInUrl(phoneNumber: string, joinMessage: string): string {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  if (!digits || !joinMessage) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(joinMessage)}`;
}

export function getDemoWhatsAppOptInConfig(
  env: WhatsAppOptInEnv = process.env
): WhatsAppOptInConfig {
  const sandboxNumber = normalizeWhatsAppNumber(env.TWILIO_WHATSAPP_FROM);
  const joinCode = String(
    env.TWILIO_WHATSAPP_SANDBOX_JOIN_CODE ||
    env.TWILIO_WHATSAPP_JOIN_CODE ||
    ""
  ).trim();
  const joinMessage = joinCode ? `join ${joinCode}` : "";

  return {
    configured: Boolean(sandboxNumber && joinCode),
    sandboxNumber,
    joinCode,
    joinMessage,
    whatsAppUrl: buildWhatsAppOptInUrl(sandboxNumber, joinMessage),
  };
}
