import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { asyncHandler, errorHandler } from "../../middleware/errorHandling.js";

describe("Error Handling Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {};
    mockResponse = {
      status: responseStatus as any,
      json: responseJson as any,
    };
    mockNext = jest.fn();
  });

  describe("asyncHandler", () => {
    it("should wrap async function and return middleware", () => {
      const asyncFn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>().mockResolvedValue(undefined);
      const wrapped = asyncHandler(asyncFn as any);

      expect(typeof wrapped).toBe("function");
      expect(wrapped.length).toBe(3); // req, res, next
    });

    it("should call async function with req, res, next", async () => {
      const asyncFn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>().mockResolvedValue(undefined);
      const wrapped = asyncHandler(asyncFn as any);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(asyncFn).toHaveBeenCalledWith(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
    });

    it("should catch errors and pass them to next", async () => {
      const testError = new Error("Test error");
      const asyncFn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>().mockRejectedValue(testError);
      const wrapped = asyncHandler(asyncFn as any);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait a bit for Promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it("should not call next when async function succeeds", async () => {
      const asyncFn = jest.fn<(req: Request, res: Response, next: NextFunction) => Promise<void>>().mockResolvedValue(undefined);
      const wrapped = asyncHandler(asyncFn as any);

      await wrapped(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Wait a bit for Promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("errorHandler", () => {
    beforeEach(() => {
      // Mock console.error to avoid cluttering test output
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should handle CastError with 400 status", () => {
      const castError = new Error("Cast to ObjectId failed");
      castError.name = "CastError";

      errorHandler(
        castError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ error: "Invalid ID format" });
    });

    it("should handle mongoose ValidationError with 400 status", () => {
      const validationError = new mongoose.Error.ValidationError();
      const validatorError = new mongoose.Error.ValidatorError({
        message: "Description is required",
        path: "description",
        value: undefined,
      });
      validationError.errors["description"] = validatorError;

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Description is required",
      });
    });

    it("should handle ValidationError with default message when no errors", () => {
      const validationError = new mongoose.Error.ValidationError();

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Validation error",
      });
    });

    it("should handle duplicate key error (E11000) with 409 status", () => {
      const duplicateError = new Error("Duplicate key error");
      (duplicateError as any).code = 11000;

      errorHandler(
        duplicateError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith({ error: "Duplicate entry" });
    });

    it("should handle generic Error with 500 status", () => {
      const genericError = new Error("Something went wrong");

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Something went wrong",
      });
    });

    it("should handle error without message with default message", () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = "";

      errorHandler(
        errorWithoutMessage,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should handle error without message property", () => {
      const errorWithoutMessage = { name: "Error" } as Error;

      errorHandler(
        errorWithoutMessage,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should log error to console", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const genericError = new Error("Test error");

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response<{ error: string }>,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalledWith("Error:", genericError);
      
      consoleSpy.mockRestore();
    });
  });
});

