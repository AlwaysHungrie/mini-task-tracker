import express, { type Express } from "express";
import authRouter from "../../routes/auth.js";
import tasksRouter from "../../routes/tasks.js";
import { errorHandler } from "../../middleware/errorHandling.js";
import cors from "cors";

export const createTestApp = (): Express => {
  const app = express();
  
  // Middleware
  app.use(cors({
    origin: "*",
    credentials: true,
  }));
  app.use(express.json());
  
  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/tasks", tasksRouter);
  
  // Error handler middleware must be last
  app.use(errorHandler);
  
  return app;
};

