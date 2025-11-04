export type TaskStatus = "pending" | "completed";

// Request Types
export interface CreateTaskRequest {
  description: string;
  dueDate: Date;
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  description?: string;
  dueDate?: Date;
  status?: TaskStatus;
}

// Response Types
export interface TaskResponse {
  id: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
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

