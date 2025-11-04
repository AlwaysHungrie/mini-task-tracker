import { Router } from "express";
import { z } from "zod";
import { Task } from "../models/task.js";
import { authenticateToken } from "../middleware/jwt.js";
import { validate } from "../middleware/validate.js";

const tasksRouter: Router = Router();

// Apply authentication to all routes
tasksRouter.use(authenticateToken);

// Validation schemas
const createTaskSchema = z.object({
  description: z.string().min(1, "Description is required").trim(),
  dueDate: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
    message: "Invalid date format",
  }),
  status: z.enum(["pending", "completed"]).optional(),
});

const updateTaskSchema = z.object({
  description: z.string().min(1, "Description is required").trim().optional(),
  dueDate: z.coerce
    .date()
    .refine((date) => !isNaN(date.getTime()), {
      message: "Invalid date format",
    })
    .optional(),
  status: z.enum(["pending", "completed"]).optional(),
});

// GET /api/tasks - List tasks for the logged-in user
tasksRouter.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.userId }).sort({
      createdAt: -1,
    });

    res.json({
      tasks: tasks.map((task) => ({
        id: String(task._id),
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - Create a new task
tasksRouter.post("/", validate(createTaskSchema), async (req, res) => {
  try {
    const { description, dueDate, status } = req.body;

    const task = new Task({
      description,
      dueDate,
      status: status || "pending",
      owner: req.userId,
    });

    await task.save();

    res.status(201).json({
      message: "Task created successfully",
      task: {
        id: String(task._id),
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/tasks/:id - Update a task
tasksRouter.put(
  "/:id",
  authenticateToken,
  validate(updateTaskSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { description, dueDate, status } = req.body;

      // Find task and verify ownership
      const task = await Task.findOne({ _id: id, owner: req.userId });

      if (!task) {
        return res.status(404).json({
          error: "Task not found or you don't have permission to update it",
        });
      }

      // Update fields if provided
      if (description !== undefined) {
        task.description = description;
      }
      if (dueDate !== undefined) {
        task.dueDate = dueDate;
      }
      if (status !== undefined) {
        task.status = status;
      }

      await task.save();

      res.json({
        message: "Task updated successfully",
        task: {
          id: String(task._id),
          description: task.description,
          status: task.status,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
        },
      });
    } catch (error) {
      console.error("Error updating task:", error);
      if (error instanceof Error && error.name === "CastError") {
        return res.status(400).json({ error: "Invalid task ID format" });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

// DELETE /api/tasks/:id - Delete a task
tasksRouter.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find task and verify ownership
    const task = await Task.findOneAndDelete({ _id: id, owner: req.userId });

    if (!task) {
      return res.status(404).json({
        error: "Task not found or you don't have permission to delete it",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    if (error instanceof Error && error.name === "CastError") {
      return res.status(400).json({ error: "Invalid task ID format" });
    }
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default tasksRouter;
