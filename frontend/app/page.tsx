"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Task, tasksApi } from "@/lib/api";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { Navbar } from "@/components/Navbar";
import { EmptyState } from "@/components/EmptyState";
import { Loader2, Plus } from "lucide-react";

export default function HomePage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await tasksApi.getTasks();
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (formData: {
    description: string;
    dueDate: string;
    status: "pending" | "completed";
  }) => {
    try {
      setError("");
      await tasksApi.createTask(formData);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    }
  };

  const handleUpdateTask = async (formData: {
    description: string;
    dueDate: string;
    status: "pending" | "completed";
  }) => {
    if (!editingTask) return;

    try {
      setError("");
      await tasksApi.updateTask(editingTask.id, formData);
      setEditingTask(null);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setError("");
      await tasksApi.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      setError("");
      await tasksApi.updateTask(task.id, {
        status: task.status === "pending" ? "completed" : "pending",
      });
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const editFormData = editingTask
    ? {
        description: editingTask.description,
        dueDate: editingTask.dueDate.split("T")[0],
        status: editingTask.status,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        userName={user?.name}
        onLogout={logout}
        isAuthenticated={isAuthenticated}
      />

      <main className="notion-page px-6 py-12">
        {isAuthenticated ? (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-[40px] font-semibold text-foreground leading-tight">
                  Tasks
                </h1>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-accent text-sm text-foreground transition-colors"
                >
                  <Plus className="size-4" />
                  New
                </button>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2 rounded bg-red-50 dark:bg-red-950/30 text-sm text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState onCreateTask={() => setShowCreateModal(true)} />
            ) : (
              <div className="bg-background rounded border border-border">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={toggleTaskStatus}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <h1 className="text-[40px] font-semibold text-foreground mb-3 leading-tight">
                Task Tracker
              </h1>
              <p className="text-muted-foreground text-[15px]">
                Sign in to start managing your tasks
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {isAuthenticated && (
        <TaskForm
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSubmit={handleCreateTask}
          title="New task"
          submitLabel="Create"
        />
      )}

      {/* Edit Task Modal */}
      {isAuthenticated && (
        <TaskForm
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onSubmit={handleUpdateTask}
          initialData={editFormData}
          title="Edit task"
          submitLabel="Save"
        />
      )}
    </div>
  );
}
