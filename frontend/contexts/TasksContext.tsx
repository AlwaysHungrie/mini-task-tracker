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

interface TasksContextType {
  tasks: TaskResponse[];
  isLoading: boolean;
  error: Error | null;
  createTask: (task: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, task: UpdateTaskRequest) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useUser();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data, isLoading, error } = useQuery<GetTasksResponse>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch("/api/tasks", {
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
        queryClient.setQueryData<GetTasksResponse>(["tasks"], {
          tasks: [...previousTasks.tasks, optimisticTask],
        });
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
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
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.map((t) =>
          t.id === id ? { ...t, ...task } : t
        );
        queryClient.setQueryData<GetTasksResponse>(["tasks"], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Toggle task status mutation
  const toggleTaskStatusMutation = useMutation({
    mutationFn: async (id: string): Promise<UpdateTaskResponse> => {
      if (!token) {
        throw new Error("Not authenticated");
      }
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
      ]);
      const task = previousTasks?.tasks.find((t) => t.id === id);
      if (!task) {
        throw new Error("Task not found");
      }
      const newStatus = task.status === "completed" ? "pending" : "completed";

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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<GetTasksResponse>([
        "tasks",
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status: (t.status === "completed"
                  ? "pending"
                  : "completed") as TaskStatus,
              }
            : t
        );
        queryClient.setQueryData<GetTasksResponse>(["tasks"], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
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
      ]);

      if (previousTasks) {
        const updatedTasks = previousTasks.tasks.filter((t) => t.id !== id);
        queryClient.setQueryData<GetTasksResponse>(["tasks"], {
          tasks: updatedTasks,
        });
      }

      return { previousTasks };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
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
    createTask: async (task: CreateTaskRequest) => {
      await createTaskMutation.mutateAsync(task);
    },
    updateTask: async (id: string, task: UpdateTaskRequest) => {
      await updateTaskMutation.mutateAsync({ id, task });
    },
    toggleTaskStatus: async (id: string) => {
      await toggleTaskStatusMutation.mutateAsync(id);
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
