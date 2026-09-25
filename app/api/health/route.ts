import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/server/redis';
import { livenessResponse, readinessResponse } from '@/lib/server/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkAuth = async () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Auth is not configured.');
  const response = await fetch(new URL('/auth/v1/health', base), {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '' },
    cache: 'no-store',
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error('Auth health check failed.');
};

const checkCache = async () => {
  const redis = getRedis();
  if (!redis) throw new Error('Configured cache is unavailable.');
  await redis.ping();
};

export const GET = async (request: Request) => {
  if (new URL(request.url).searchParams.get('probe') === 'live') return livenessResponse();

  const cacheConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_TOKEN);
  return readinessResponse({
    database: () => prisma.$queryRaw`SELECT 1`,
    auth: checkAuth,
    ...(cacheConfigured ? { cache: checkCache } : {}),
  });
};
