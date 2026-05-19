import assert from "node:assert/strict";

import {
  isWhatsAppConfigured,
  normalizeWhatsAppAddress,
  whatsapp,
} from "./twilio";

const originalSid = process.env.TWILIO_ACCOUNT_SID;
const originalToken = process.env.TWILIO_AUTH_TOKEN;
const originalFrom = process.env.TWILIO_WHATSAPP_FROM;

delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_WHATSAPP_FROM;

assert.equal(normalizeWhatsAppAddress("+15551234567"), "whatsapp:+15551234567");
assert.equal(normalizeWhatsAppAddress(" whatsapp:+15557654321 "), "whatsapp:+15557654321");
assert.equal(isWhatsAppConfigured(), false);

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

if (originalFrom === undefined) {
  delete process.env.TWILIO_WHATSAPP_FROM;
} else {
  process.env.TWILIO_WHATSAPP_FROM = originalFrom;
}

console.log("Twilio WhatsApp helper regression passed");
