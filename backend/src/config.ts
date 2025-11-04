import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3001;
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12");
export const MONGO_URI = process.env.MONGO_URI || "";
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
export const REDIS_HOST = process.env.REDIS_HOST || "localhost";
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_USERNAME = process.env.REDIS_USERNAME || "default";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";