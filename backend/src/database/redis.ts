import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME } from "../config.js";

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD!,
  username: REDIS_USERNAME,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Cache key generator for user tasks
export const getUserTasksCacheKey = (userId: string): string => {
  return `tasks:user:${userId}`;
};
