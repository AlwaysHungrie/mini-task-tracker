import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Task } from "../models/task.js";
import { authenticateToken } from "../middleware/jwt.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandling.js";
import {
  getCachedTasks,
  setCachedTasks,
  invalidateUserTasksCache,
} from "../utils/cache.js";
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  GetTasksResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  ErrorResponse,
} from "../types/tasks.js";

const tasksRouter: Router = Router();

// Apply authentication to all routes
tasksRouter.use(authenticateToken);

// GET /api/tasks - List tasks for the logged-in user
tasksRouter.get(
  "/",
  asyncHandler(
    async (req: Request, res: Response<GetTasksResponse | ErrorResponse>) => {
      // Try to get from cache first
      const cached = await getCachedTasks(req.userId!);
      if (cached) {
        return res.json(cached);
      }

      // If not in cache, fetch from database
      const tasks = await Task.find({ owner: req.userId }).sort({
        createdAt: -1,
      });

      const response: GetTasksResponse = {
        tasks: tasks.map(
          (task): TaskResponse => ({
            id: String(task._id),
            description: task.description,
            status: task.status,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
          })
        ),
      };

      // Cache the result
      await setCachedTasks(req.userId!, response);

      res.json(response);
    }
  )
);

// POST /api/tasks - Create a new task
tasksRouter.post(
  "/",
  validate(
    z.object({
      description: z.string().min(1, "Description is required").trim(),
      dueDate: z.coerce.date().refine((date) => !isNaN(date.getTime()), {
        message: "Invalid date format",
      }),
      status: z.enum(["pending", "completed"]).optional(),
    })
  ),
  asyncHandler(
    async (
      req: Request<{}, CreateTaskResponse | ErrorResponse, CreateTaskRequest>,
      res: Response<CreateTaskResponse | ErrorResponse>
    ) => {
      const { description, dueDate, status } = req.body;

      const task = new Task({
        description,
        dueDate,
        status: status || "pending",
        owner: req.userId,
      });

      await task.save();

      // Invalidate cache after creating a task
      await invalidateUserTasksCache(req.userId!);

      const response: CreateTaskResponse = {
        message: "Task created successfully",
        task: {
          id: String(task._id),
          description: task.description,
          status: task.status,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
        },
      };

      res.status(201).json(response);
    }
  )
);

// PUT /api/tasks/:id - Update a task
tasksRouter.put(
  "/:id",
  authenticateToken,
  validate(
    z.object({
      description: z
        .string()
        .min(1, "Description is required")
        .trim()
        .optional(),
      dueDate: z.coerce
        .date()
        .refine((date) => !isNaN(date.getTime()), {
          message: "Invalid date format",
        })
        .optional(),
      status: z.enum(["pending", "completed"]).optional(),
    })
  ),
  asyncHandler<
    { id: string },
    UpdateTaskResponse | ErrorResponse,
    UpdateTaskRequest
  >(
    async (
      req: Request<
        { id: string },
        UpdateTaskResponse | ErrorResponse,
        UpdateTaskRequest
      >,
      res: Response<UpdateTaskResponse | ErrorResponse>
    ) => {
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
        task.dueDate = dueDate as Date;
      }
      if (status !== undefined) {
        task.status = status as typeof task.status;
      }

      await task.save();

      // Invalidate cache after updating a task
      await invalidateUserTasksCache(req.userId!);

      const response: UpdateTaskResponse = {
        message: "Task updated successfully",
        task: {
          id: String(task._id),
          description: task.description,
          status: task.status,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
        },
      };

      res.json(response);
    }
  )
);

// DELETE /api/tasks/:id - Delete a task
tasksRouter.delete(
  "/:id",
  authenticateToken,
  asyncHandler<{ id: string }, DeleteTaskResponse | ErrorResponse>(
    async (
      req: Request<{ id: string }, DeleteTaskResponse | ErrorResponse>,
      res: Response<DeleteTaskResponse | ErrorResponse>
    ) => {
      const { id } = req.params;

      // Find task and verify ownership
      const task = await Task.findOneAndDelete({ _id: id, owner: req.userId });

      if (!task) {
        return res.status(404).json({
          error: "Task not found or you don't have permission to delete it",
        });
      }

      // Invalidate cache after deleting a task
      await invalidateUserTasksCache(req.userId!);

      const response: DeleteTaskResponse = {
        message: "Task deleted successfully",
      };

      res.json(response);
    }
  )
);

export default tasksRouter;
