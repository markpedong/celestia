import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

export const getRedis = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  try {
    redis ??= Redis.fromEnv();
  } catch (error) {
    console.error('Redis client setup failed:', error);
    return null;
  }

  return redis;
};
