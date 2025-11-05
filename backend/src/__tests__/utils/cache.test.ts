import type { GetTasksResponse } from "../../types/tasks.js";
import {
  clearTestRedis,
  mockRedis,
} from "../helpers/redisMock.js";
import {
  getCacheLockKey,
  getUserTasksCacheKey,
  type TaskFilterParams,
} from "../../database/redis.js";
import {
  getCachedTasks,
  setCachedTasks,
  invalidateUserTasksCache,
  dateReviver,
} from "../../utils/cache.js";
import * as redisModule from "../../database/redis.js";

// Mock the redis module before importing anything that uses it
jest.mock("database/redis.js", () => ({
  __esModule: true,
  redisClient: mockRedis,
}));

describe("Cache Functions", () => {
  const testUserId = "test-user-123";
  const testTasks: GetTasksResponse = {
    tasks: [
      {
        id: "task-1",
        description: "Test task 1",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "task-2",
        description: "Test task 2",
        status: "completed",
        dueDate: new Date("2024-12-30"),
        createdAt: new Date("2024-01-02"),
      },
    ],
  };

  beforeEach(async () => {
    await clearTestRedis(redisModule.redisClient);
  });

  describe("getCachedTasks", () => {
    it("should return cached tasks when cache hit", async () => {
      const filters: TaskFilterParams = { status: "pending" };
      const cacheKey = getUserTasksCacheKey(testUserId, filters);

      await redisModule.redisClient.set(
        cacheKey,
        JSON.stringify(testTasks),
        "EX",
        900
      );

      const result = await getCachedTasks(testUserId, filters);
      expect(result).toEqual(testTasks);
    });

    it("should return null when cache miss", async () => {
      const result = await getCachedTasks(testUserId);
      expect(result).toBeNull();
    });

    it("should handle Redis errors gracefully", async () => {
      const originalGet = redisModule.redisClient.get.bind(
        redisModule.redisClient
      );
      (redisModule.redisClient as any).get = jest
        .fn()
        .mockRejectedValue(new Error("Redis error"));

      const result = await getCachedTasks(testUserId);
      expect(result).toBeNull();

      redisModule.redisClient.get = originalGet;
    });
  });

  describe("setCachedTasks", () => {
    it("should set cache and release lock", async () => {
      const filters: TaskFilterParams = { status: "pending" };
      const cacheKey = getUserTasksCacheKey(testUserId, filters);
      const lockKey = getCacheLockKey(testUserId, filters);

      await redisModule.redisClient.set(lockKey, "1", "EX", 30);
      await setCachedTasks(testUserId, testTasks, filters);

      const cached = await redisModule.redisClient.get(cacheKey);
      expect(cached).toBeTruthy();
      expect(JSON.parse(cached!, dateReviver)).toEqual(testTasks);

      const lockExists = await redisModule.redisClient.exists(lockKey);
      expect(lockExists).toBe(0);
    });

    it("should handle Redis errors gracefully", async () => {
      const originalSetex = redisModule.redisClient.setex.bind(
        redisModule.redisClient
      );
      (redisModule.redisClient as any).setex = jest
        .fn()
        .mockRejectedValue(new Error("Redis error"));

      await expect(
        setCachedTasks(testUserId, testTasks)
      ).resolves.not.toThrow();

      redisModule.redisClient.setex = originalSetex;
    });

    it("should release lock even if cache setting fails", async () => {
      const filters: TaskFilterParams = { status: "pending" };
      const lockKey = getCacheLockKey(testUserId, filters);

      await redisModule.redisClient.set(lockKey, "1", "EX", 30);

      const originalSetex = redisModule.redisClient.setex.bind(
        redisModule.redisClient
      );
      (redisModule.redisClient as any).setex = jest
        .fn()
        .mockRejectedValue(new Error("Redis error"));

      await setCachedTasks(testUserId, testTasks, filters);

      const lockExists = await redisModule.redisClient.exists(lockKey);
      expect(lockExists).toBe(0);

      redisModule.redisClient.setex = originalSetex;
    });
  });

  describe("invalidateUserTasksCache", () => {
    it("should invalidate all cache and lock keys for a user", async () => {
      const filters1: TaskFilterParams = { status: "pending" };
      const filters2: TaskFilterParams = { status: "completed" };
      const lockKey1 = getCacheLockKey(testUserId, filters1);
      const lockKey2 = getCacheLockKey(testUserId, filters2);

      const cacheKey1 = getUserTasksCacheKey(testUserId, filters1);
      const cacheKey2 = getUserTasksCacheKey(testUserId, filters2);

      await redisModule.redisClient.set(
        cacheKey1,
        JSON.stringify(testTasks),
        "EX",
        900
      );
      await redisModule.redisClient.set(
        cacheKey2,
        JSON.stringify(testTasks),
        "EX",
        900
      );
      await redisModule.redisClient.set(lockKey1, "1", "EX", 30);
      await redisModule.redisClient.set(lockKey2, "1", "EX", 30);

      await invalidateUserTasksCache(testUserId);

      expect(await redisModule.redisClient.exists(cacheKey1)).toBe(0);
      expect(await redisModule.redisClient.exists(cacheKey2)).toBe(0);
      expect(await redisModule.redisClient.exists(lockKey1)).toBe(0);
      expect(await redisModule.redisClient.exists(lockKey2)).toBe(0);
    });

    it("should handle Redis errors gracefully", async () => {
      const originalScan = redisModule.redisClient.scan.bind(
        redisModule.redisClient
      );
      (redisModule.redisClient as any).scan = jest
        .fn()
        .mockRejectedValue(new Error("Redis error"));

      await expect(invalidateUserTasksCache(testUserId)).resolves.not.toThrow();

      redisModule.redisClient.scan = originalScan;
    });
  });
});
