import { getRedis } from './redis';

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowSeconds: number,
  options: { failOpen?: boolean } = {},
) => {
  const { failOpen = true } = options;
  const redis = getRedis();
  if (!redis) return failOpen;

  try {
    const count = await redis.incr(`rate:${key}`);
    if (count === 1) await redis.expire(`rate:${key}`, windowSeconds);
    return count <= limit;
  } catch {
    // External exceptions may include URLs or credentials; never log raw details.
    console.error('Redis rate limit failed.');
    return failOpen;
  }
};
