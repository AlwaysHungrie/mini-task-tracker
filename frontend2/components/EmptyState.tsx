import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateTask?: () => void;
}

export function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="mb-1 text-[16px] font-medium text-foreground">
        No tasks yet
      </p>
      {onCreateTask && (
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-accent text-sm text-foreground transition-colors"
        >
          <Plus className="size-4" />
          New task
        </button>
      )}
    </div>
  );
}
