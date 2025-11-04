import express from "express";
import { connectToMongoDB } from "./database/mongodb.js";
import { PORT } from "./config.js";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";
import { errorHandler } from "./middleware/errorHandling.js";

const app = express();

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
