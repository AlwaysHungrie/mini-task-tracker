"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateTaskRequest, TaskResponse } from "@/lib/types/api";
import { useTasks } from "@/contexts/TasksContext";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskResponse | null;
}

export function EditTaskDialog({ open, onOpenChange, task }: EditTaskDialogProps) {
  const { updateTask } = useTasks();
  const [formData, setFormData] = useState<UpdateTaskRequest>({
    description: "",
    dueDate: "",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        description: task.description,
        dueDate: task.dueDate.split("T")[0], // Convert ISO date to YYYY-MM-DD
        status: task.status,
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    setIsSubmitting(true);
    try {
      await updateTask(task.id, formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dueDate">Due Date</Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

