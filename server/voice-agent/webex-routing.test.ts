import assert from "node:assert/strict";

import { buildDemoWebexMessageArgs, getPredefinedDemoWebexRoomId } from "./webex-routing";

assert.equal(
  getPredefinedDemoWebexRoomId({
    DEMO_WEBEX_SPACE_ID: " test-clus-room ",
    WEBEX_SPACE_ID: "active-demo-room",
  } as NodeJS.ProcessEnv),
  "test-clus-room"
);

assert.equal(
  getPredefinedDemoWebexRoomId({
    STORE_MANAGER_WEBEX_SPACE_ID: "manager-room",
    WEBEX_SPACE_ID: "active-demo-room",
  } as NodeJS.ProcessEnv),
  "manager-room"
);

assert.equal(
  getPredefinedDemoWebexRoomId({
    WEBEX_SPACE_ID: "test-clus-fallback",
  } as NodeJS.ProcessEnv),
  "test-clus-fallback"
);

assert.deepEqual(
  buildDemoWebexMessageArgs("reservation confirmation", {
    DEMO_WEBEX_SPACE_ID: "test-clus-room",
    WEBEX_SPACE_ID: "active-demo-room",
  } as NodeJS.ProcessEnv),
  { message: "reservation confirmation", roomId: "test-clus-room" }
);

assert.deepEqual(
  buildDemoWebexMessageArgs("manager summary", {} as NodeJS.ProcessEnv),
  { message: "manager summary" }
);

console.log("Demo Webex routing regression passed");
