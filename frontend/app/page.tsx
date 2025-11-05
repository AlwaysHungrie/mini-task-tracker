"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useTasks, TaskFilters } from "@/contexts/TasksContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { TaskResponse } from "@/lib/types/api";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const {
    tasks,
    isLoading,
    toggleTaskStatus,
    deleteTask,
    filters,
    setFilters,
    clearFilters,
  } = useTasks();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // Local state for filter inputs
  const [statusFilter, setStatusFilter] = useState<string>(
    filters.status || ""
  );
  const [dueDateFilter, setDueDateFilter] = useState<string>(
    filters.dueDate || ""
  );

  // Sync local state with context filters
  useEffect(() => {
    setStatusFilter(filters.status || "");
    setDueDateFilter(filters.dueDate || "");
  }, [filters]);

  const handleApplyFilters = () => {
    const newFilters: TaskFilters = {};
    if (statusFilter) {
      newFilters.status = statusFilter as "pending" | "completed";
    }
    if (dueDateFilter) {
      newFilters.dueDate = dueDateFilter;
    }
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setDueDateFilter("");
    clearFilters();
  };

  const hasActiveFilters = filters.status || filters.dueDate;

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
        <p className="text-muted-foreground">
          Please log in to view your tasks
        </p>
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

      {/* Filter Section */}
      <div className="border rounded-lg p-4 mb-6 bg-muted/30">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="due-date-filter">Due Date</Label>
            <Input
              id="due-date-filter"
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} variant="default">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 text-sm text-muted-foreground">
            Active filters:{" "}
            {filters.status && (
              <span className="font-medium">Status: {filters.status}</span>
            )}
            {filters.dueDate && (
              <>
                {filters.status && ", "}
                <span className="font-medium">Due Date: {filters.dueDate}</span>
              </>
            )}
          </div>
        )}
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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
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
                          {task.status === "completed"
                            ? "Mark Pending"
                            : "Mark Complete"}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
