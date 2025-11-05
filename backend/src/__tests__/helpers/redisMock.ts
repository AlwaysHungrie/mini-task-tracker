import * as Redis from "ioredis-mock";
import { Redis as RedisType } from "ioredis";

export const setupTestRedis = (): RedisType => {
  console.log('setting up test redis');
  const mockRedis = new (Redis.default as any)() as RedisType;
  return mockRedis;
};

export const teardownTestRedis = async (): Promise<void> => {
  if (mockRedis) {
    await mockRedis.flushall();
    await mockRedis.quit();
  }
};

export const clearTestRedis = async (client?: typeof mockRedis): Promise<void> => {
  const redisClient = client || mockRedis;
  if (redisClient) {
    // Manually delete all keys since flushdb/flushall may not work reliably with ioredis-mock
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }
};

export const mockRedis = setupTestRedis();
