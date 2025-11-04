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

taskSchema.index({ owner: 1 }); // incase we want to all tasks for a specific owner
taskSchema.index({ status: 1 }); // incase we want to all tasks by a status
taskSchema.index({ owner: 1, status: 1 }); // incase we want to all tasks for a specific owner and status
export const Task = mongoose.model<ITask>("Task", taskSchema);
