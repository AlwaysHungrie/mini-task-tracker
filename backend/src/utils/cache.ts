import {
  redisClient,
  getUserTasksCacheKey,
  getUserTasksCachePattern,
  getCacheLockKey,
  type TaskFilterParams,
} from "../database/redis.js";
import type { GetTasksResponse } from "../types/tasks.js";

const CACHE_TTL = 900; // 15 minutes in seconds
const LOCK_TTL = 30; // 30 seconds lock expiration
const LOCK_RETRY_DELAY = 100; // 100ms delay between lock retries
const MAX_LOCK_RETRIES = 10; // Maximum number of lock retry attempts

/**
 * Acquire a lock to prevent cache stampede
 * Returns true if lock was acquired, false otherwise
 */
async function acquireLock(
  lockKey: string,
  ttl: number = LOCK_TTL
): Promise<boolean> {
  try {
    // SET key value NX EX ttl - atomic operation
    const result = await redisClient.set(lockKey, "1", "EX", ttl, "NX");
    return result === "OK";
  } catch (error) {
    console.error("Error acquiring lock:", error);
    return false;
  }
}

/**
 * Release a lock
 */
async function releaseLock(lockKey: string): Promise<void> {
  try {
    // Use UNLINK for non-blocking deletion
    await redisClient.unlink(lockKey);
  } catch (error) {
    console.error("Error releasing lock:", error);
    // Don't throw - lock release failures shouldn't break the app
  }
}

/**
 * Wait for lock to be released with exponential backoff
 */
async function waitForLock(
  lockKey: string,
  maxRetries: number = MAX_LOCK_RETRIES
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const exists = await redisClient.exists(lockKey);
    if (!exists) {
      return true; // Lock is released
    }
    // Wait with increasing delay
    await new Promise((resolve) =>
      setTimeout(resolve, LOCK_RETRY_DELAY * (i + 1))
    );
  }
  return false; // Lock still held after max retries
}

/**
 * Reviver function for JSON.parse to convert date strings back to Date objects
 * JSON.stringify converts Date objects to ISO 8601 strings, so we need to convert them back
 */
export function dateReviver(key: string, value: any): any {
  // JSON.stringify converts Date objects to ISO 8601 strings like "2024-12-31T00:00:00.000Z"
  // We detect these by checking if the string matches ISO date format and parses to a valid date
  if (typeof value === "string") {
    // Check if it looks like an ISO date string
    // Matches: "2024-12-31" or "2024-12-31T00:00:00.000Z" or similar ISO formats
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
    if (isoDatePattern.test(value)) {
      const date = new Date(value);
      // Only convert if it's a valid date
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  return value;
}

export async function getCachedTasks(
  userId: string,
  filters?: TaskFilterParams
): Promise<GetTasksResponse | null> {
  try {
    const cacheKey = getUserTasksCacheKey(userId, filters);
    const lockKey = getCacheLockKey(userId, filters);

    // Try to get from cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached, dateReviver) as GetTasksResponse;
    }

    // Cache miss - try to acquire lock to prevent stampede
    const lockAcquired = await acquireLock(lockKey);
    if (!lockAcquired) {
      // Lock is held by another request - wait for it and check cache again
      const lockReleased = await waitForLock(lockKey);
      if (lockReleased) {
        // Check cache again after lock is released
        const retryCached = await redisClient.get(cacheKey);
        if (retryCached) {
          return JSON.parse(retryCached, dateReviver) as GetTasksResponse;
        }
      }
    }

    // Return null if we couldn't get from cache
    // The caller will fetch from DB and set the cache
    // If we acquired the lock, we'll release it after the caller sets the cache
    return null;
  } catch (error) {
    console.error("Error getting cached tasks:", error);
    return null;
  }
}

export async function setCachedTasks(
  userId: string,
  data: GetTasksResponse,
  filters?: TaskFilterParams
): Promise<void> {
  try {
    const cacheKey = getUserTasksCacheKey(userId, filters);
    const lockKey = getCacheLockKey(userId, filters);

    // Set the cache
    await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(data));

    // Release the lock if we're holding it
    await releaseLock(lockKey);
  } catch (error) {
    console.error("Error setting cached tasks:", error);
    // Don't throw - caching failures shouldn't break the app
    // Still try to release lock
    try {
      const lockKey = getCacheLockKey(userId, filters);
      await releaseLock(lockKey);
    } catch (lockError) {
      // Ignore lock release errors
    }
  }
}

export async function invalidateUserTasksCache(userId: string): Promise<void> {
  try {
    // Use SCAN to find and delete keys in batches (not streaming to array)
    const pattern = getUserTasksCachePattern(userId);
    const lockPattern = `lock:${pattern}`;
    let cursor = "0";
    const batchSize = 100;

    // Delete cache keys
    do {
      // SCAN returns [cursor, keys[]]
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        batchSize
      );

      cursor = nextCursor;

      // Delete keys in batches using UNLINK (non-blocking)
      if (keys.length > 0) {
        await redisClient.unlink(...keys);
      }
    } while (cursor !== "0"); // Continue until cursor is 0 (scan complete)

    // Also clean up any lock keys for this user
    cursor = "0";
    do {
      const [nextCursor, lockKeys] = await redisClient.scan(
        cursor,
        "MATCH",
        lockPattern,
        "COUNT",
        batchSize
      );

      cursor = nextCursor;

      if (lockKeys.length > 0) {
        await redisClient.unlink(...lockKeys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error("Error invalidating cached tasks:", error);
    // Don't throw - caching failures shouldn't break the app
  }
}

