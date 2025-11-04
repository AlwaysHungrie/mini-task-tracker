import { Router } from "express";
import { z } from "zod";
import { User } from "../models/user.js";
import { issueToken } from "../middleware/jwt.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandling.js";

const authRouter: Router = Router();

// Register route
authRouter.post(
  "/register",
  validate(
    z.object({
      name: z.string().min(1, "Name is required").trim(),
      email: z.email("Invalid email format").toLowerCase().trim(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
  ),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    // Generate JWT token
    const token = issueToken(String(user._id), user.email);

    // Return user data (excluding password) and token
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  })
);

// Login route
authRouter.post(
  "/login",
  validate(
    z.object({
      email: z.email("Invalid email format").toLowerCase().trim(),
      password: z.string().min(1, "Password is required"),
    })
  ),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = issueToken(String(user._id), user.email);

    // Return user data (excluding password) and token
    res.json({
      message: "Login successful",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  })
);

export default authRouter;
