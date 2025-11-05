import mongoose, { Schema, Document } from "mongoose";
import type { IUser } from "./user.js";

enum TaskStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export interface ITask extends Document {
  description: string;
  status: TaskStatus;
  dueDate: Date;
  owner: mongoose.Types.ObjectId | IUser;
  createdAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: TaskStatus,
      default: TaskStatus.PENDING,
    },
    dueDate: {
      type: Date,
      required: [true, "dueDate is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "owner is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // manually managing createdAt as per requirements
  }
);

// Indexes for query patterns:
// 1. Base query: get all tasks for a user, sorted by createdAt (descending)
taskSchema.index({ owner: 1, createdAt: -1 });

// 2. Status filter: get tasks filtered by status, sorted by createdAt (descending)
taskSchema.index({ owner: 1, status: 1, createdAt: -1 });

// 3. DueDate filter: get tasks filtered by dueDate range, sorted by createdAt (descending)
taskSchema.index({ owner: 1, dueDate: 1, createdAt: -1 });
export const Task = mongoose.model<ITask>("Task", taskSchema);
