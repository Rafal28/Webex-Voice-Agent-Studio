import assert from "node:assert/strict";

process.env.WEBEX_ACCESS_TOKEN = "test-webex-token";
process.env.WEBEX_SPACE_ID = "active-demo-room";

const { message } = await import("./webex");

const sentRooms: string[] = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (_input, init) => {
  const payload = JSON.parse(String(init?.body || "{}"));
  sentRooms.push(payload.roomId);
  return new Response(JSON.stringify({ id: "message-123" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

try {
  const defaultResult = await message({ message: "reservation confirmation" });
  assert.equal(defaultResult.success, true);

  const managerResult = await message({
    message: "store manager summary",
    roomId: "test-clus-room",
  });
  assert.equal(managerResult.success, true);

  assert.deepEqual(sentRooms, ["active-demo-room", "test-clus-room"]);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Webex room override regression passed");
