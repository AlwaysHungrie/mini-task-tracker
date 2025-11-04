import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface ErrorResponse {
  error: string;
}

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 */
export const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => Promise<any>
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Handles various error types and returns appropriate responses
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) => {
  // Log error for debugging
  console.error("Error:", error);

  // Handle MongoDB CastError (invalid ObjectId format)
  if (error instanceof Error && error.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  // Handle MongoDB ValidationError
  if (error instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(error.errors)[0];
    return res.status(400).json({
      error: firstError?.message || "Validation error",
    });
  }

  // Handle MongoDB duplicate key error (E11000)
  if (error instanceof Error && "code" in error && error.code === 11000) {
    return res.status(409).json({ error: "Duplicate entry" });
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: error.message || "Internal server error",
  });
};

