import Redis from "ioredis";
import { env } from "@/env";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

if (!env.REDIS_URL) {
  throw new Error("REDIS_URL is required for rate limiting");
}

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });

globalForRedis.redis = redis;
