import express from "express";
import { connectToDatabase } from "./database.js";
import { PORT } from "./config.js";
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

const initServer = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

initServer();
