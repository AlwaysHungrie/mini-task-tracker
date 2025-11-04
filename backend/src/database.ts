import mongoose from "mongoose";
import { MONGO_URI } from "./config.js";
import { Task } from "./models/task.js";
import { User } from "./models/user.js";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to mongodb");

    await Task.createIndexes();
    await User.createIndexes();

    console.log("Indexes created");
  } catch (error) {
    console.error("Error connecting to mongodb", error as Error);
    process.exit(1);
  }
};
