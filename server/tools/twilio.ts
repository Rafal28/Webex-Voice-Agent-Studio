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

type SmsProvider = "twilio" | "webex_connect";

const WEBEX_CONNECT_SMS_API_URL = "https://api.us.webexconnect.io/v2/messages";

function getEnvValue(env: NodeJS.ProcessEnv, key: string): string {
  return env[key]?.trim() || "";
}

function normalizeSmsProvider(value: string | undefined): SmsProvider | null {
  const normalized = String(value || "").trim().toLowerCase().replace(/-/g, "_");
  if (!normalized) return null;
  if (normalized === "twilio") return "twilio";
  if (normalized === "webex_connect" || normalized === "webexconnect") return "webex_connect";
  return null;
}

export function isTwilioSmsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    getEnvValue(env, "TWILIO_ACCOUNT_SID") &&
    getEnvValue(env, "TWILIO_AUTH_TOKEN") &&
    (getEnvValue(env, "TWILIO_PHONE_NUMBER") || getEnvValue(env, "TWILIO_MESSAGING_SERVICE_SID"))
  );
}

export function isWebexConnectSmsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    getEnvValue(env, "WEBEX_CONNECT_SMS_KEY") &&
    getEnvValue(env, "WEBEX_CONNECT_SMS_FROM")
  );
}

export function getSmsProvider(env: NodeJS.ProcessEnv = process.env): SmsProvider {
  const configured = normalizeSmsProvider(env.SMS_PROVIDER);
  if (configured) return configured;
  if (isTwilioSmsConfigured(env)) return "twilio";
  if (isWebexConnectSmsConfigured(env)) return "webex_connect";
  return "twilio";
}

export function isSmsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const provider = getSmsProvider(env);
  return provider === "webex_connect"
    ? isWebexConnectSmsConfigured(env)
    : isTwilioSmsConfigured(env);
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
  const provider = getSmsProvider();
  if (provider === "webex_connect") {
    return sendWebexConnectSms(args);
  }

  return sendTwilioSms(args);
}

async function sendTwilioSms(args: Record<string, any>): Promise<{ success: boolean; result?: string; error?: string }> {
  const accountSid = getEnvValue(process.env, "TWILIO_ACCOUNT_SID");
  const authToken = getEnvValue(process.env, "TWILIO_AUTH_TOKEN");
  const fromPhone = getEnvValue(process.env, "TWILIO_PHONE_NUMBER");
  const messagingServiceSid = getEnvValue(process.env, "TWILIO_MESSAGING_SERVICE_SID");

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

export function buildWebexConnectSmsPayload(args: Record<string, any>, env: NodeJS.ProcessEnv = process.env): Record<string, any> {
  const to = String(args.to || "").trim();
  const body = String(args.body || "").trim();
  const correlationId = String(args.correlationId || args.reservationId || "voice-agent").trim();
  const callbackData = getEnvValue(env, "WEBEX_CONNECT_SMS_CALLBACK_DATA");
  const notifyUrl = getEnvValue(env, "WEBEX_CONNECT_SMS_NOTIFY_URL");

  return {
    channel: "sms",
    from: getEnvValue(env, "WEBEX_CONNECT_SMS_FROM"),
    to: [
      {
        msisdn: [to],
        correlationId,
      },
    ],
    ...(callbackData ? { callbackData } : {}),
    ...(notifyUrl ? { notifyUrl } : {}),
    content: {
      type: "text",
      text: body,
    },
  };
}

async function sendWebexConnectSms(args: Record<string, any>): Promise<{ success: boolean; result?: string; error?: string }> {
  const apiKey = getEnvValue(process.env, "WEBEX_CONNECT_SMS_KEY");
  const fromPhone = getEnvValue(process.env, "WEBEX_CONNECT_SMS_FROM");
  const apiUrl = getEnvValue(process.env, "WEBEX_CONNECT_SMS_API_URL") || WEBEX_CONNECT_SMS_API_URL;

  if (!apiKey || !fromPhone) {
    return { success: false, error: "Webex Connect SMS is not configured" };
  }

  const { to, body } = args;
  if (typeof to !== "string" || !to.trim()) {
    return { success: false, error: "SMS destination phone number is required" };
  }
  if (typeof body !== "string" || !body.trim()) {
    return { success: false, error: "SMS body is required" };
  }

  try {
    console.log(`Sending Webex Connect SMS to ${to}...`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        key: apiKey,
      },
      body: JSON.stringify(buildWebexConnectSmsPayload(args)),
    });

    const responseText = await response.text();
    let responseBody: any = null;
    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
    }

    if (!response.ok) {
      const details = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
      return {
        success: false,
        error: `Webex Connect SMS failed: ${response.status} ${response.statusText}${details ? ` - ${details}` : ""}`,
      };
    }

    const reference =
      responseBody?.messageId ||
      responseBody?.message_id ||
      responseBody?.response?.messageId ||
      args.correlationId ||
      args.reservationId ||
      "accepted";
    console.log(`Webex Connect SMS sent successfully. Reference: ${reference}`);
    return {
      success: true,
      result: `SMS successfully sent to ${to} via Webex Connect. Reference ID: ${reference}`,
    };
  } catch (error: any) {
    console.error("Webex Connect SMS exception:", error);
    return { success: false, error: error.message || "Failed to send Webex Connect SMS" };
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
