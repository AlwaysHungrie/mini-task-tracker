'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Task, tasksApi } from '@/lib/api';

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  error: string;
  fetchTasks: () => Promise<void>;
  createTask: (formData: {
    description: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }) => Promise<void>;
  updateTask: (id: string, formData: {
    description: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (task: Task) => Promise<void>;
  setError: (error: string) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await tasksApi.getTasks();
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchTasks]);

  const createTask = useCallback(async (formData: {
    description: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }) => {
    try {
      setError('');
      await tasksApi.createTask(formData);
      await fetchTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  }, [fetchTasks]);

  const updateTask = useCallback(async (id: string, formData: {
    description: string;
    dueDate: string;
    status: 'pending' | 'completed';
  }) => {
    try {
      setError('');
      await tasksApi.updateTask(id, formData);
      await fetchTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      throw err;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setError('');
      await tasksApi.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [fetchTasks]);

  const toggleTaskStatus = useCallback(async (task: Task) => {
    try {
      setError('');
      await tasksApi.updateTask(task.id, {
        status: task.status === 'pending' ? 'completed' : 'pending',
      });
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [fetchTasks]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        setError,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}

