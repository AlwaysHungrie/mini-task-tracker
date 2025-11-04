/**
 * API Types matching the backend API responses
 */

export type TaskStatus = "pending" | "completed";

// Auth Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Task Types
export interface TaskResponse {
  id: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
}

export interface CreateTaskRequest {
  description: string;
  dueDate: string; // ISO date string
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  description?: string;
  dueDate?: string; // ISO date string
  status?: TaskStatus;
}

export interface GetTasksResponse {
  tasks: TaskResponse[];
}

export interface CreateTaskResponse {
  message: string;
  task: TaskResponse;
}

export interface UpdateTaskResponse {
  message: string;
  task: TaskResponse;
}

export interface DeleteTaskResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

