import assert from "node:assert/strict";

import {
  buildWebexConnectSmsPayload,
  getSmsProvider,
  isSmsConfigured,
  isWebexConnectSmsConfigured,
  isWhatsAppConfigured,
  normalizeWhatsAppAddress,
  sms,
  whatsapp,
} from "./twilio";

const originalSmsProvider = process.env.SMS_PROVIDER;
const originalSid = process.env.TWILIO_ACCOUNT_SID;
const originalToken = process.env.TWILIO_AUTH_TOKEN;
const originalPhone = process.env.TWILIO_PHONE_NUMBER;
const originalFrom = process.env.TWILIO_WHATSAPP_FROM;
const originalWebexKey = process.env.WEBEX_CONNECT_SMS_KEY;
const originalWebexFrom = process.env.WEBEX_CONNECT_SMS_FROM;
const originalWebexNotifyUrl = process.env.WEBEX_CONNECT_SMS_NOTIFY_URL;
const originalWebexCallbackData = process.env.WEBEX_CONNECT_SMS_CALLBACK_DATA;
const originalFetch = globalThis.fetch;

delete process.env.SMS_PROVIDER;
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_PHONE_NUMBER;
delete process.env.TWILIO_WHATSAPP_FROM;
delete process.env.WEBEX_CONNECT_SMS_KEY;
delete process.env.WEBEX_CONNECT_SMS_FROM;
delete process.env.WEBEX_CONNECT_SMS_NOTIFY_URL;
delete process.env.WEBEX_CONNECT_SMS_CALLBACK_DATA;

assert.equal(normalizeWhatsAppAddress("+15551234567"), "whatsapp:+15551234567");
assert.equal(normalizeWhatsAppAddress(" whatsapp:+15557654321 "), "whatsapp:+15557654321");
assert.equal(isWhatsAppConfigured(), false);
assert.equal(isSmsConfigured(), false);

const missingConfigResult = await whatsapp({
  to: "+15551234567",
  body: "Reservation confirmed.",
});
assert.equal(missingConfigResult.success, false);
assert.match(missingConfigResult.error || "", /WhatsApp.*not configured/i);

process.env.TWILIO_ACCOUNT_SID = "AC123";
process.env.TWILIO_AUTH_TOKEN = "secret";
process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
assert.equal(isWhatsAppConfigured(), true);

process.env.SMS_PROVIDER = "webex_connect";
process.env.WEBEX_CONNECT_SMS_KEY = "test-key";
process.env.WEBEX_CONNECT_SMS_FROM = "16693323901";
process.env.WEBEX_CONNECT_SMS_NOTIFY_URL = "https://example.test/notify";
process.env.WEBEX_CONNECT_SMS_CALLBACK_DATA = "reservation-confirmation";
assert.equal(getSmsProvider(), "webex_connect");
assert.equal(isWebexConnectSmsConfigured(), true);
assert.equal(isSmsConfigured(), true);

assert.deepEqual(
  buildWebexConnectSmsPayload({
    to: "+15615551212",
    body: "Here is your order confirmation.",
    reservationId: "RES-123",
  }),
  {
    channel: "sms",
    from: "16693323901",
    to: [
      {
        msisdn: ["+15615551212"],
        correlationId: "RES-123",
      },
    ],
    callbackData: "reservation-confirmation",
    notifyUrl: "https://example.test/notify",
    content: {
      type: "text",
      text: "Here is your order confirmation.",
    },
  }
);

let capturedRequest: { url: string; init?: RequestInit } | null = null;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  capturedRequest = { url: String(url), init };
  return new Response(JSON.stringify({ messageId: "msg-123" }), {
    status: 202,
    statusText: "Accepted",
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

const webexSmsResult = await sms({
  to: "+15615551212",
  body: "Here is your order confirmation.",
  reservationId: "RES-123",
});
assert.equal(webexSmsResult.success, true);
assert.match(webexSmsResult.result || "", /Webex Connect/i);
assert.equal(capturedRequest?.url, "https://api.us.webexconnect.io/v2/messages");
assert.equal(capturedRequest?.init?.method, "POST");
assert.equal((capturedRequest?.init?.headers as Record<string, string>)?.key, "test-key");
assert.equal(
  JSON.parse(String(capturedRequest?.init?.body)).to[0].msisdn[0],
  "+15615551212"
);

globalThis.fetch = originalFetch;

if (originalSid === undefined) {
  delete process.env.TWILIO_ACCOUNT_SID;
} else {
  process.env.TWILIO_ACCOUNT_SID = originalSid;
}

if (originalToken === undefined) {
  delete process.env.TWILIO_AUTH_TOKEN;
} else {
  process.env.TWILIO_AUTH_TOKEN = originalToken;
}

if (originalPhone === undefined) {
  delete process.env.TWILIO_PHONE_NUMBER;
} else {
  process.env.TWILIO_PHONE_NUMBER = originalPhone;
}

if (originalFrom === undefined) {
  delete process.env.TWILIO_WHATSAPP_FROM;
} else {
  process.env.TWILIO_WHATSAPP_FROM = originalFrom;
}

if (originalSmsProvider === undefined) {
  delete process.env.SMS_PROVIDER;
} else {
  process.env.SMS_PROVIDER = originalSmsProvider;
}

if (originalWebexKey === undefined) {
  delete process.env.WEBEX_CONNECT_SMS_KEY;
} else {
  process.env.WEBEX_CONNECT_SMS_KEY = originalWebexKey;
}

if (originalWebexFrom === undefined) {
  delete process.env.WEBEX_CONNECT_SMS_FROM;
} else {
  process.env.WEBEX_CONNECT_SMS_FROM = originalWebexFrom;
}

if (originalWebexNotifyUrl === undefined) {
  delete process.env.WEBEX_CONNECT_SMS_NOTIFY_URL;
} else {
  process.env.WEBEX_CONNECT_SMS_NOTIFY_URL = originalWebexNotifyUrl;
}

if (originalWebexCallbackData === undefined) {
  delete process.env.WEBEX_CONNECT_SMS_CALLBACK_DATA;
} else {
  process.env.WEBEX_CONNECT_SMS_CALLBACK_DATA = originalWebexCallbackData;
}

globalThis.fetch = originalFetch;

console.log("Twilio and Webex Connect messaging helper regression passed");
