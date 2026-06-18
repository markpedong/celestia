const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export const normalizeDatabaseUrl = (databaseUrl: string | undefined): string | undefined => {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get("sslmode");

    if (sslMode && LEGACY_SSL_MODES.has(sslMode) && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
};
