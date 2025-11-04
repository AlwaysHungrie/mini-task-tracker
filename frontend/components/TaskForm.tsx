"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskFormData {
  description: string;
  dueDate: string;
  status: "pending" | "completed";
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: TaskFormData;
  title: string;
  submitLabel: string;
}

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  submitLabel,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    description: "",
    dueDate: "",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ description: "", dueDate: "", status: "pending" });
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (!initialData) {
        setFormData({ description: "", dueDate: "", status: "pending" });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[20px] font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-normal text-foreground">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              placeholder="What needs to be done?"
              className="text-[15px]"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-normal text-foreground">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              required
              className="text-[15px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-normal text-foreground">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "completed") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status" className="w-full text-[15px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="text-sm bg-foreground text-background hover:bg-foreground/90"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
