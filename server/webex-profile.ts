export interface WebexProfile {
  bearerToken?: string;
  webexSpaceId?: string;
}

const runtimeProfile: WebexProfile = {};

function normalizeBearerToken(token?: string): string | undefined {
  const trimmed = token?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^Bearer\s+/i, "").trim();
}

function normalizeSpaceId(spaceId?: string): string | undefined {
  const trimmed = spaceId?.trim();
  return trimmed || undefined;
}

export function getWebexProfile(): WebexProfile {
  return {
    bearerToken: runtimeProfile.bearerToken || normalizeBearerToken(process.env.WEBEX_ACCESS_TOKEN),
    webexSpaceId: runtimeProfile.webexSpaceId || normalizeSpaceId(process.env.WEBEX_SPACE_ID),
  };
}

export function updateWebexProfile(update: WebexProfile): WebexProfile {
  if (update.bearerToken !== undefined) {
    runtimeProfile.bearerToken = normalizeBearerToken(update.bearerToken);
  }

  if (update.webexSpaceId !== undefined) {
    runtimeProfile.webexSpaceId = normalizeSpaceId(update.webexSpaceId);
  }

  return getWebexProfile();
}
