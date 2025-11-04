"use client";

import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useTasks } from "@/contexts/TasksContext";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { TaskResponse } from "@/lib/types/api";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const { tasks, isLoading, toggleTaskStatus, deleteTask } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  const handleEdit = (task: TaskResponse) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (taskId: string) => {
    try {
      await toggleTaskStatus(taskId);
    } catch (error) {
      console.error("Failed to toggle task status:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Please log in to view your tasks</p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  // Show message if no tasks
  if (tasks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Task</Button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
        </div>
        <CreateTaskDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      </div>
    );
  }

  // Show tasks as rows
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create Task</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Due Date</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <p
                      className={`font-medium ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.description}
                    </p>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(task.id)}
                      >
                        {task.status === "completed" ? "Mark Pending" : "Mark Complete"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTaskDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
