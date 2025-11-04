import express from "express";
import { connectToMongoDB } from "./database/mongodb.js";
import { FRONTEND_URL, PORT } from "./config.js";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";
import { errorHandler } from "./middleware/errorHandling.js";
import cors from "cors";

const app = express();
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Middleware
app.use(express.json());
app.get("/health", (_, res) => res.sendStatus(200));

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

// Error handler middleware must be last
app.use(errorHandler);

const initServer = async () => {
  await connectToMongoDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

initServer();
