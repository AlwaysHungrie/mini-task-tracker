import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals";
import { clearTestRedis, mockRedis } from "../helpers/redisMock.js";

// Mock the redis module before importing anything that uses it
jest.mock("database/redis.js", () => {
  const actual = jest.requireActual("database/redis.js");
  return {
    ...actual,
    redisClient: mockRedis,
  };
});

import request from "supertest";
import { User } from "../../models/user.js";
import { Task } from "../../models/task.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from "../helpers/mongodb.js";
import { createTestApp } from "../helpers/testApp.js";
import { issueToken } from "../../middleware/jwt.js";
import * as redisModule from "../../database/redis.js";

describe("Task Routes", () => {
  const app = createTestApp();
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    await User.createIndexes();
    await Task.createIndexes();
  });

  beforeEach(async () => {
    await clearDatabase();
    await clearTestRedis(redisModule.redisClient);

    // Create a test user
    testUser = new User({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    await testUser.save();

    // Generate auth token
    authToken = issueToken(String(testUser._id), testUser.email);
  });

  afterEach(async () => {
    await clearDatabase();
    await clearTestRedis(redisModule.redisClient);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("GET /api/tasks", () => {
    it("should return empty array when user has no tasks", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(response.body.tasks).toEqual([]);
    });

    it("should return all tasks for the authenticated user", async () => {
      // Create tasks for the test user
      const task1 = new Task({
        description: "Task 1",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      const task2 = new Task({
        description: "Task 2",
        status: "completed",
        dueDate: new Date("2024-12-30"),
        owner: testUser._id,
      });
      await task1.save();
      await task2.save();

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0]).toHaveProperty("id");
      expect(response.body.tasks[0]).toHaveProperty("description");
      expect(response.body.tasks[0]).toHaveProperty("status");
      expect(response.body.tasks[0]).toHaveProperty("dueDate");
      expect(response.body.tasks[0]).toHaveProperty("createdAt");
    });

    it("should only return tasks belonging to the authenticated user", async () => {
      // Create another user
      const otherUser = new User({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
      });
      await otherUser.save();

      // Create tasks for both users
      const myTask = new Task({
        description: "My Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      const otherTask = new Task({
        description: "Other Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: otherUser._id,
      });
      await myTask.save();
      await otherTask.save();

      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].description).toBe("My Task");
    });

    it("should filter tasks by status", async () => {
      const pendingTask = new Task({
        description: "Pending Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      const completedTask = new Task({
        description: "Completed Task",
        status: "completed",
        dueDate: new Date("2024-12-30"),
        owner: testUser._id,
      });
      await pendingTask.save();
      await completedTask.save();

      const response = await request(app)
        .get("/api/tasks?status=pending")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe("pending");
      expect(response.body.tasks[0].description).toBe("Pending Task");
    });

    it("should filter tasks by completed status", async () => {
      const pendingTask = new Task({
        description: "Pending Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      const completedTask = new Task({
        description: "Completed Task",
        status: "completed",
        dueDate: new Date("2024-12-30"),
        owner: testUser._id,
      });
      await pendingTask.save();
      await completedTask.save();

      const response = await request(app)
        .get("/api/tasks?status=completed")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].status).toBe("completed");
      expect(response.body.tasks[0].description).toBe("Completed Task");
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .get("/api/tasks?status=invalid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid status");
    });

    it("should filter tasks by due date", async () => {
      const task1 = new Task({
        description: "Task 1",
        status: "pending",
        dueDate: new Date("2024-12-31T12:00:00Z"),
        owner: testUser._id,
      });
      const task2 = new Task({
        description: "Task 2",
        status: "pending",
        dueDate: new Date("2024-12-30T12:00:00Z"),
        owner: testUser._id,
      });
      await task1.save();
      await task2.save();

      const response = await request(app)
        .get("/api/tasks?dueDate=2024-12-31")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].description).toBe("Task 1");
    });

    it("should return 400 for invalid dueDate format", async () => {
      const response = await request(app)
        .get("/api/tasks?dueDate=invalid-date")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid dueDate format");
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Access token required");
    });

    it("should return 403 for invalid token", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", "Bearer invalid-token")
        .expect(403);

      expect(response.body).toHaveProperty("error", "Invalid or expired token");
    });
  });

  describe("POST /api/tasks", () => {
    it("should create a new task successfully", async () => {
      const taskData = {
        description: "New Task",
        dueDate: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty("message", "Task created successfully");
      expect(response.body).toHaveProperty("task");
      expect(response.body.task.description).toBe("New Task");
      expect(response.body.task.status).toBe("pending"); // Default status
      expect(response.body.task).toHaveProperty("id");
      expect(response.body.task).toHaveProperty("dueDate");
      expect(response.body.task).toHaveProperty("createdAt");
    });

    it("should create task with specified status", async () => {
      const taskData = {
        description: "New Task",
        dueDate: "2024-12-31",
        status: "completed",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.task.status).toBe("completed");
    });

    it("should return 400 if description is missing", async () => {
      const taskData = {
        dueDate: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("description");
    });

    it("should return 400 if dueDate is missing", async () => {
      const taskData = {
        description: "New Task",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("dueDate");
    });

    it("should return 400 for invalid date format", async () => {
      const taskData = {
        description: "New Task",
        dueDate: "invalid-date",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should return 400 for invalid status", async () => {
      const taskData = {
        description: "New Task",
        dueDate: "2024-12-31",
        status: "invalid-status",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should trim description", async () => {
      const taskData = {
        description: "  New Task  ",
        dueDate: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.task.description).toBe("New Task");
    });

    it("should return 401 if no token is provided", async () => {
      const taskData = {
        description: "New Task",
        dueDate: "2024-12-31",
      };

      const response = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Access token required");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    let taskId: string;

    beforeEach(async () => {
      const task = new Task({
        description: "Original Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      await task.save();
      taskId = String(task._id);
    });

    it("should update task description successfully", async () => {
      const updateData = {
        description: "Updated Task",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Task updated successfully");
      expect(response.body.task.description).toBe("Updated Task");
    });

    it("should update task status successfully", async () => {
      const updateData = {
        status: "completed",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.task.status).toBe("completed");
    });

    it("should update task dueDate successfully", async () => {
      const updateData = {
        dueDate: "2025-01-15",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.task).toHaveProperty("dueDate");
    });

    it("should update multiple fields at once", async () => {
      const updateData = {
        description: "Updated Task",
        status: "completed",
        dueDate: "2025-01-15",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.task.description).toBe("Updated Task");
      expect(response.body.task.status).toBe("completed");
    });

    it("should return 404 if task does not exist", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
      const updateData = {
        description: "Updated Task",
      };

      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should return 404 if task belongs to another user", async () => {
      // Create another user
      const otherUser = new User({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
      });
      await otherUser.save();

      // Create task for other user
      const otherTask = new Task({
        description: "Other Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: otherUser._id,
      });
      await otherTask.save();

      const updateData = {
        description: "Hacked Task",
      };

      const response = await request(app)
        .put(`/api/tasks/${otherTask._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should return 400 for invalid status", async () => {
      const updateData = {
        status: "invalid-status",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should return 400 for invalid date format", async () => {
      const updateData = {
        dueDate: "invalid-date",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should return 400 for empty description", async () => {
      const updateData = {
        description: "",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
    });

    it("should return 401 if no token is provided", async () => {
      const updateData = {
        description: "Updated Task",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Access token required");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    let taskId: string;

    beforeEach(async () => {
      const task = new Task({
        description: "Task to Delete",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: testUser._id,
      });
      await task.save();
      taskId = String(task._id);
    });

    it("should delete task successfully", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message", "Task deleted successfully");

      // Verify task is deleted
      const deletedTask = await Task.findById(taskId);
      expect(deletedTask).toBeNull();
    });

    it("should return 404 if task does not exist", async () => {
      const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format

      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should return 404 if task belongs to another user", async () => {
      // Create another user
      const otherUser = new User({
        name: "Other User",
        email: "other@example.com",
        password: "password123",
      });
      await otherUser.save();

      // Create task for other user
      const otherTask = new Task({
        description: "Other Task",
        status: "pending",
        dueDate: new Date("2024-12-31"),
        owner: otherUser._id,
      });
      await otherTask.save();

      const response = await request(app)
        .delete(`/api/tasks/${otherTask._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Task not found");
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toHaveProperty("error", "Access token required");
    });
  });
});

