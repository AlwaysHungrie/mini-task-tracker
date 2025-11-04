import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3001;
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12");
export const MONGO_URI = process.env.MONGO_URI || "";