"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "./UserContext";
import {
  TaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTasksResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  TaskStatus,
} from "@/lib/types/api";

export interface TaskFilters {
  status?: "pending" | "completed";
  dueDate?: string; // YYYY-MM-DD format - exact date match
}

interface TasksContextType {
  tasks: TaskResponse[];
  isLoading: boolean;
  error: Error | null;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  createTask: (task: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, task: UpdateTaskRequest) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useUser();
  const queryClient = useQueryClient();
  const [filters, setFiltersState] = React.useState<TaskFilters>({});

  // Fetch tasks with filters
  const { data, isLoading, error } = useQuery<GetTasksResponse>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.set("status", filters.status);
      if (filters.dueDate) queryParams.set("dueDate", filters.dueDate);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/tasks?${queryString}` : "/api/tasks";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const setFilters = React.useCallback((newFilters: TaskFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = React.useCallback(() => {
    setFiltersState({});
  }, []);

  // Create task mutation with optimistic updates
  const createTaskMutation = useMutation({
    mutationFn: async (
      task: CreateTaskRequest
    ): Promise<CreateTaskResponse> => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      return response.json();
    },
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
        filters,
      ]);

      // Optimistically update to the new value
      if (previousTasks) {
        const optimisticTask: TaskResponse = {
          id: `temp-${Date.now()}`,
          description: newTask.description,
          status: newTask.status || "pending",
          dueDate: newTask.dueDate,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<GetTasksResponse>(["tasks", filters], {
          tasks: [...previousTasks.tasks, optimisticTask],
        });
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", filters], context.previousTasks);
      }
    },
    onSuccess: (data) => {
      // Refetch tasks to get the real data from server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      task,
    }: {
      id: string;
      task: UpdateTaskRequest;
    }): Promise<UpdateTaskResponse> => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(task),
      });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onMutate: async ({ id, task }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
        filters,
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.map((t) =>
          t.id === id ? { ...t, ...task } : t
        );
        queryClient.setQueryData<GetTasksResponse>(["tasks", filters], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", filters], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Toggle task status mutation
  const toggleTaskStatusMutation = useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: TaskStatus;
    }): Promise<UpdateTaskResponse> => {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle task status");
      }
      return response.json();
    },
    onMutate: async ({ id, newStatus }: { id: string; newStatus: TaskStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
        filters,
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.map((t) =>
          t.id === id ? { ...t, status: newStatus } : t
        );
        queryClient.setQueryData<GetTasksResponse>(["tasks", filters], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", filters], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
        filters,
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.filter((t) => t.id !== id);
        queryClient.setQueryData<GetTasksResponse>(["tasks", filters], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", filters], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const value: TasksContextType = {
    tasks: data?.tasks || [],
    isLoading,
    error: error as Error | null,
    filters,
    setFilters,
    clearFilters,
    createTask: async (task: CreateTaskRequest) => {
      await createTaskMutation.mutateAsync(task);
    },
    updateTask: async (id: string, task: UpdateTaskRequest) => {
      await updateTaskMutation.mutateAsync({ id, task });
    },
    toggleTaskStatus: async (id: string) => {
      // Get current task status before optimistic update
      const currentTasks = queryClient.getQueryData<GetTasksResponse>(["tasks", filters]);
      const task = currentTasks?.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error("Task not found");
      }
      const newStatus = (task.status === "completed"
        ? "pending"
        : "completed") as TaskStatus;
      await toggleTaskStatusMutation.mutateAsync({ id, newStatus });
    },
    deleteTask: async (id: string) => {
      await deleteTaskMutation.mutateAsync(id);
    },
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
