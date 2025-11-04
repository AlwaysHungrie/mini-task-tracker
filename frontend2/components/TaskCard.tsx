"use client";

import { Task } from "@/lib/api";
import { CheckCircle2, Circle, Trash2, Edit } from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggleStatus, onEdit, onDelete }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      onDelete(task.id);
    }
    setShowActions(false);
  };

  return (
    <div
      className="notion-list-item group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <button
        onClick={() => onToggleStatus(task)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isCompleted ? "Mark as pending" : "Mark as complete"}
      >
        {isCompleted ? (
          <CheckCircle2 className="size-4 text-foreground" />
        ) : (
          <Circle className="size-4" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className={`text-[15px] leading-6 ${
            isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {task.description}
        </div>
        <div className="text-[13px] text-muted-foreground mt-0.5">
          {new Date(task.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              onEdit(task);
              setShowActions(false);
            }}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit task"
          >
            <Edit className="size-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
