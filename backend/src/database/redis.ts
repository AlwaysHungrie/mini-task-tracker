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

// Cache key generator for user tasks with filters
export interface TaskFilterParams {
  status?: "pending" | "completed";
  dueDate?: string; // YYYY-MM-DD format
}

export const getUserTasksCacheKey = (
  userId: string,
  filters?: TaskFilterParams
): string => {
  const status = filters?.status || "all";
  const dueDate = filters?.dueDate || "all";
  return `tasks:user:${userId}:status:${status}:dueDate:${dueDate}`;
};

// Generate pattern for invalidation
export const getUserTasksCachePattern = (userId: string): string => {
  return `tasks:user:${userId}:*`;
};

// Lock key for cache stampede prevention
export const getCacheLockKey = (
  userId: string,
  filters?: TaskFilterParams
): string => {
  const cacheKey = getUserTasksCacheKey(userId, filters);
  return `lock:${cacheKey}`;
};
