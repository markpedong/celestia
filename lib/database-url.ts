const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export const normalizeDatabaseUrl = (databaseUrl: string | undefined): string | undefined => {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const directSupabaseHost = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(url.hostname);
    const poolerHost = process.env.SUPABASE_POOLER_HOST;

    if (directSupabaseHost && poolerHost) {
      const projectRef = directSupabaseHost[1];
      url.hostname = poolerHost;
      url.port = process.env.SUPABASE_POOLER_PORT ?? '5432';
      if (decodeURIComponent(url.username) === 'postgres') {
        url.username = `postgres.${projectRef}`;
      }
    }

    const sslMode = url.searchParams.get("sslmode");

    if (sslMode && LEGACY_SSL_MODES.has(sslMode) && !url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
};
