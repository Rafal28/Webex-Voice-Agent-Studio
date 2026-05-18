export function getPredefinedDemoWebexRoomId(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const roomId = env.DEMO_WEBEX_SPACE_ID || env.STORE_MANAGER_WEBEX_SPACE_ID || env.WEBEX_SPACE_ID;
  const trimmed = roomId?.trim();
  return trimmed || undefined;
}

export function buildDemoWebexMessageArgs(
  message: string,
  env: NodeJS.ProcessEnv = process.env
): Record<string, string> {
  const roomId = getPredefinedDemoWebexRoomId(env);
  return roomId ? { message, roomId } : { message };
}
