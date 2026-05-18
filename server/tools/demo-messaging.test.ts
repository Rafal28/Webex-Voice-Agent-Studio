import assert from "node:assert/strict";

process.env.TWILIO_ACCOUNT_SID = "AC00000000000000000000000000000000";
process.env.TWILIO_AUTH_TOKEN = "test-token";
process.env.TWILIO_PHONE_NUMBER = "+15555550100";
delete process.env.DEMO_ENABLE_SMS;

const { realtimeTools } = await import("./index");

assert.equal(
  realtimeTools.some((tool) => tool.name === "twilio_sms"),
  false
);

console.log("demo messaging SMS exposure regression passed");
