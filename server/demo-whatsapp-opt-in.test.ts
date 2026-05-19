import assert from "node:assert/strict";

import {
  buildWhatsAppOptInUrl,
  getDemoWhatsAppOptInConfig,
  normalizeWhatsAppNumber,
} from "./demo-whatsapp-opt-in";

assert.equal(normalizeWhatsAppNumber("whatsapp:+14155238886"), "+14155238886");
assert.equal(normalizeWhatsAppNumber(" +14155238886 "), "+14155238886");
assert.equal(
  buildWhatsAppOptInUrl("+1 (415) 523-8886", "join wore-calm"),
  "https://wa.me/14155238886?text=join%20wore-calm"
);

assert.deepEqual(
  getDemoWhatsAppOptInConfig({
    TWILIO_WHATSAPP_FROM: "whatsapp:+14155238886",
    TWILIO_WHATSAPP_SANDBOX_JOIN_CODE: "wore-calm",
  }),
  {
    configured: true,
    sandboxNumber: "+14155238886",
    joinCode: "wore-calm",
    joinMessage: "join wore-calm",
    whatsAppUrl: "https://wa.me/14155238886?text=join%20wore-calm",
  }
);

assert.equal(getDemoWhatsAppOptInConfig({}).configured, false);

console.log("WhatsApp opt-in config regression passed");
