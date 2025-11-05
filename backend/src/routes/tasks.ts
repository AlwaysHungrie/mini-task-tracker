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
      const { status, dueDate } = req.query;
      
      // Build filter object
      const filter: any = { owner: req.userId };

      // Build cache filter params
      const cacheFilters: { status?: "pending" | "completed"; dueDate?: string } = {};

      // Filter by status if provided
      if (status) {
        if (status === "pending" || status === "completed") {
          filter.status = status;
          cacheFilters.status = status as "pending" | "completed";
        } else {
          return res.status(400).json({
            error: "Invalid status. Must be 'pending' or 'completed'",
          });
        }
      }

      // Filter by exact due date if provided
      if (dueDate) {
        const date = new Date(dueDate as string);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            error: "Invalid dueDate format. Use YYYY-MM-DD",
          });
        }
        // Set time to start and end of day for exact date match
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.dueDate = { $gte: startOfDay, $lte: endOfDay };
        // Store normalized date string for cache key (YYYY-MM-DD)
        const normalizedDate = (dueDate as string).split("T")[0];
        if (normalizedDate) {
          cacheFilters.dueDate = normalizedDate;
        }
      }

      // Try to get from cache first (works for both filtered and unfiltered queries)
      const cached = await getCachedTasks(
        req.userId!,
        Object.keys(cacheFilters).length > 0 ? cacheFilters : undefined
      );
      if (cached) {
        return res.json(cached);
      }

      // If not in cache, fetch from database
      const tasks = await Task.find(filter).sort({
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

      // Cache the result (for both filtered and unfiltered queries)
      await setCachedTasks(
        req.userId!,
        response,
        Object.keys(cacheFilters).length > 0 ? cacheFilters : undefined
      );

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
