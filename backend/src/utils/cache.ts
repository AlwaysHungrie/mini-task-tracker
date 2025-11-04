import { redisClient, getUserTasksCacheKey } from "../database/redis.js";
import type { GetTasksResponse } from "../types/tasks.js";

const CACHE_TTL = 300; // 5 minutes in seconds

export async function getCachedTasks(userId: string): Promise<GetTasksResponse | null> {
  try {
    const cacheKey = getUserTasksCacheKey(userId);
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GetTasksResponse;
    }
    return null;
  } catch (error) {
    console.error("Error getting cached tasks:", error);
    return null;
  }
}

export async function setCachedTasks(userId: string, data: GetTasksResponse): Promise<void> {
  try {
    const cacheKey = getUserTasksCacheKey(userId);
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting cached tasks:", error);
    // Don't throw - caching failures shouldn't break the app
  }
}

export async function invalidateUserTasksCache(userId: string): Promise<void> {
  try {
    const cacheKey = getUserTasksCacheKey(userId);
    await redisClient.del(cacheKey);
  } catch (error) {
    console.error("Error invalidating cached tasks:", error);
    // Don't throw
  }
}

