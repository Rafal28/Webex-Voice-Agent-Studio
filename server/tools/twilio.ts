export const twilioTools = [
  {
    type: "function" as const,
    name: "twilio_sms",
    description: "Send an SMS text message to a specific phone number. Use this when the user asks you to send a text message.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The destination phone number to send the SMS to, in E.164 format (e.g., +1234567890).",
        },
        body: {
          type: "string",
          description: "The content of the text message to send.",
        },
      },
      required: ["to", "body"],
    },
  },
];

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  );
}

export function normalizeWhatsAppAddress(phoneNumber: string): string {
  const trimmed = String(phoneNumber || "").trim();
  if (trimmed.toLowerCase().startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed}`;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );
}

export async function sms(args: Record<string, any>): Promise<{ success: boolean; result?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    return { success: false, error: "Twilio credentials are not configured" };
  }

  const { to, body } = args;
  if (typeof to !== "string" || !to.trim()) {
    return { success: false, error: "SMS destination phone number is required" };
  }
  if (typeof body !== "string" || !body.trim()) {
    return { success: false, error: "SMS body is required" };
  }

  try {
    console.log(`Sending Twilio SMS to ${to}...`);
    
    // dynamically import twilio to avoid top-level issues
    const twilioModule = (await import("twilio")).default;
    const client = twilioModule(accountSid, authToken);
    
    const message = await client.messages.create({
      body,
      ...(messagingServiceSid ? { messagingServiceSid } : { from: fromPhone }),
      to,
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return { 
      success: true, 
      result: `SMS successfully sent to ${to}. Reference ID: ${message.sid}` 
    };
  } catch (error: any) {
    console.error("Twilio SMS exception:", error);
    return { success: false, error: error.message || "Failed to send SMS" };
  }
}

export async function whatsapp(args: Record<string, any>): Promise<{ success: boolean; result?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromWhatsApp) {
    return { success: false, error: "Twilio WhatsApp is not configured" };
  }

  const { to, body } = args;
  if (typeof to !== "string" || !to.trim()) {
    return { success: false, error: "WhatsApp destination phone number is required" };
  }
  if (typeof body !== "string" || !body.trim()) {
    return { success: false, error: "WhatsApp body is required" };
  }

  try {
    const toWhatsApp = normalizeWhatsAppAddress(to);
    const from = normalizeWhatsAppAddress(fromWhatsApp);
    console.log(`Sending Twilio WhatsApp message to ${toWhatsApp}...`);

    const twilioModule = (await import("twilio")).default;
    const client = twilioModule(accountSid, authToken);

    const message = await client.messages.create({
      body,
      from,
      to: toWhatsApp,
    });

    console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
    return {
      success: true,
      result: `WhatsApp message successfully sent to ${toWhatsApp}. Reference ID: ${message.sid}`,
    };
  } catch (error: any) {
    console.error("Twilio WhatsApp exception:", error);
    return { success: false, error: error.message || "Failed to send WhatsApp message" };
  }
}
