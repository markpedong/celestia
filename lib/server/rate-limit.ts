import { getRedis } from './redis';

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowSeconds: number,
) => {
  const redis = getRedis();
  if (!redis) return true;

  try {
    const count = await redis.incr(`rate:${key}`);
    if (count === 1) await redis.expire(`rate:${key}`, windowSeconds);
    return count <= limit;
  } catch (error) {
    console.error('Redis rate limit failed:', error);
    return true;
  }
};
