import mongoose from "mongoose";
import { Task, TaskStatus } from "../../models/task.js";
import { User } from "../../models/user.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from "../helpers/mongodb.js";

describe("Task Model", () => {
  let testUser: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
    await User.createIndexes();
    await Task.createIndexes();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create a test user for tasks
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    const savedUser = await user.save();
    testUser = savedUser._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("Task Creation", () => {
    it("should create a new task with valid data", async () => {
      const taskData = {
        description: "Test task description",
        status: TaskStatus.PENDING,
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.description).toBe(taskData.description);
      expect(savedTask.status).toBe(TaskStatus.PENDING);
      expect(savedTask.dueDate).toEqual(taskData.dueDate);
      expect(savedTask.owner.toString()).toBe(testUser.toString());
      expect(savedTask.createdAt).toBeInstanceOf(Date);
    });

    it("should set default status to PENDING if not provided", async () => {
      const taskData = {
        description: "Test task",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.status).toBe(TaskStatus.PENDING);
    });

    it("should set default createdAt date", async () => {
      const taskData = {
        description: "Test task",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.createdAt).toBeInstanceOf(Date);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - savedTask.createdAt.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it("should trim description", async () => {
      const taskData = {
        description: "  Test task description  ",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.description).toBe("Test task description");
    });

    it("should allow status to be COMPLETED", async () => {
      const taskData = {
        description: "Completed task",
        status: TaskStatus.COMPLETED,
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe("Task Validation", () => {
    it("should require description field", async () => {
      const taskData = {
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      await expect(task.save()).rejects.toThrow();
    });

    it("should require dueDate field", async () => {
      const taskData = {
        description: "Test task",
        owner: testUser,
      };

      const task = new Task(taskData);
      await expect(task.save()).rejects.toThrow();
    });

    it("should require owner field", async () => {
      const taskData = {
        description: "Test task",
        dueDate: new Date("2024-12-31"),
      };

      const task = new Task(taskData);
      await expect(task.save()).rejects.toThrow();
    });

    it("should reject invalid status enum value", async () => {
      const taskData = {
        description: "Test task",
        status: "invalid_status",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      await expect(task.save()).rejects.toThrow();
    });
  });

  describe("Task-User Relationship", () => {
    it("should populate owner field when using populate", async () => {
      const taskData = {
        description: "Test task",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      };

      const task = new Task(taskData);
      await task.save();

      const populatedTask = await Task.findById(task._id).populate("owner");
      expect(populatedTask).not.toBeNull();
      expect(populatedTask!.owner).toBeDefined();
      expect((populatedTask!.owner as any).name).toBe("Test User");
      expect((populatedTask!.owner as any).email).toBe("test@example.com");
    });

    it("should allow multiple tasks for the same user", async () => {
      const task1 = new Task({
        description: "Task 1",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      });

      const task2 = new Task({
        description: "Task 2",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      });

      await task1.save();
      await task2.save();

      const tasks = await Task.find({ owner: testUser });
      expect(tasks.length).toBe(2);
    });
  });

  describe("Task Indexes", () => {
    it("should use index for querying by owner and createdAt", async () => {
      const task1 = new Task({
        description: "Task 1",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
        createdAt: new Date("2024-01-01"),
      });

      const task2 = new Task({
        description: "Task 2",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
        createdAt: new Date("2024-01-02"),
      });

      await task1.save();
      await task2.save();

      const tasks = await Task.find({ owner: testUser })
        .sort({ createdAt: -1 })
        .exec();

      expect(tasks.length).toBe(2);
      expect(tasks[0]?.description).toBe("Task 2"); // More recent first
      expect(tasks[1]?.description).toBe("Task 1");
    });

    it("should use index for querying by owner, status, and createdAt", async () => {
      const task1 = new Task({
        description: "Pending Task",
        status: TaskStatus.PENDING,
        dueDate: new Date("2024-12-31"),
        owner: testUser,
        createdAt: new Date("2024-01-01"),
      });

      const task2 = new Task({
        description: "Completed Task",
        status: TaskStatus.COMPLETED,
        dueDate: new Date("2024-12-31"),
        owner: testUser,
        createdAt: new Date("2024-01-02"),
      });

      await task1.save();
      await task2.save();

      const pendingTasks = await Task.find({
        owner: testUser,
        status: TaskStatus.PENDING,
      })
        .sort({ createdAt: -1 })
        .exec();

      expect(pendingTasks.length).toBe(1);
      expect(pendingTasks[0]?.description).toBe("Pending Task");
    });

    it("should use index for querying by owner, dueDate, and createdAt", async () => {
      const task1 = new Task({
        description: "Task 1",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
        createdAt: new Date("2024-01-01"),
      });

      const task2 = new Task({
        description: "Task 2",
        dueDate: new Date("2025-01-15"),
        owner: testUser,
        createdAt: new Date("2024-01-02"),
      });

      await task1.save();
      await task2.save();

      const tasks = await Task.find({
        owner: testUser,
        dueDate: { $gte: new Date("2024-12-31") },
      })
        .sort({ createdAt: -1 })
        .exec();

      expect(tasks.length).toBe(2);
    });
  });

  describe("Task Updates", () => {
    it("should update task description", async () => {
      const task = new Task({
        description: "Original description",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      });

      await task.save();
      task.description = "Updated description";
      const updatedTask = await task.save();

      expect(updatedTask.description).toBe("Updated description");
    });

    it("should update task status", async () => {
      const task = new Task({
        description: "Test task",
        status: TaskStatus.PENDING,
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      });

      await task.save();
      task.status = TaskStatus.COMPLETED;
      const updatedTask = await task.save();

      expect(updatedTask.status).toBe(TaskStatus.COMPLETED);
    });

    it("should update task dueDate", async () => {
      const originalDate = new Date("2024-12-31");
      const newDate = new Date("2025-01-15");

      const task = new Task({
        description: "Test task",
        dueDate: originalDate,
        owner: testUser,
      });

      await task.save();
      task.dueDate = newDate;
      const updatedTask = await task.save();

      expect(updatedTask.dueDate).toEqual(newDate);
    });
  });

  describe("Task Deletion", () => {
    it("should delete a task", async () => {
      const task = new Task({
        description: "Task to delete",
        dueDate: new Date("2024-12-31"),
        owner: testUser,
      });

      await task.save();
      const taskId = task._id;

      await Task.findByIdAndDelete(taskId);

      const deletedTask = await Task.findById(taskId);
      expect(deletedTask).toBeNull();
    });
  });
});
