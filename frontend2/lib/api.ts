const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateTaskRequest {
  description: string;
  dueDate: string;
  status?: 'pending' | 'completed';
}

export interface UpdateTaskRequest {
  description?: string;
  dueDate?: string;
  status?: 'pending' | 'completed';
}

export interface TasksResponse {
  tasks: Task[];
}

// Get auth token from localStorage
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Set auth token in localStorage
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

// Remove auth token from localStorage
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Tasks API
export const tasksApi = {
  getTasks: async (): Promise<TasksResponse> => {
    return apiRequest<TasksResponse>('/api/tasks');
  },

  createTask: async (data: CreateTaskRequest): Promise<{ message: string; task: Task }> => {
    return apiRequest<{ message: string; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<{ message: string; task: Task }> => {
    return apiRequest<{ message: string; task: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

