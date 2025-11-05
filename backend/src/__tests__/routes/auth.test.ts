import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "@jest/globals";
import request from "supertest";
import { User } from "../../models/user.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from "../helpers/mongodb.js";
import { createTestApp } from "../helpers/testApp.js";

describe("Auth Routes", () => {
  const app = createTestApp();

  beforeAll(async () => {
    await setupTestDatabase();
    await User.createIndexes();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("message", "User registered successfully");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty("password");
      expect(typeof response.body.token).toBe("string");
    });

    it("should return 409 if user with email already exists", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // Create user first
      await new User(userData).save();

      // Try to register again
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty("error", "User with this email already exists");
    });

    it("should return 400 if name is missing", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("name");
    });

    it("should return 400 if email is missing", async () => {
      const userData = {
        name: "Test User",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("email");
    });

    it("should return 400 if password is missing", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("password");
    });

    it("should return 400 if email format is invalid", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("email");
    });

    it("should return 400 if password is too short", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "12345",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("password");
    });

    it("should trim and lowercase email", async () => {
      const userData = {
        name: "Test User",
        email: "  TEST@EXAMPLE.COM  ",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should trim name", async () => {
      const userData = {
        name: "  Test User  ",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.user.name).toBe("Test User");
    });
  });

  describe("POST /api/auth/login", () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    beforeEach(async () => {
      await new User(userData).save();
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.user).not.toHaveProperty("password");
      expect(typeof response.body.token).toBe("string");
    });

    it("should return 401 if user does not exist", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });

    it("should return 401 if password is incorrect", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          password: userData.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("email");
    });

    it("should return 400 if password is missing", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: userData.email,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("password");
    });

    it("should return 400 if email format is invalid", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: userData.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Validation failed");
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].path).toBe("email");
    });

    it("should handle email case insensitivity", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "TEST@EXAMPLE.COM",
          password: userData.password,
        })
        .expect(200);

      expect(response.body.user.email).toBe("test@example.com");
    });

    it("should trim email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "  test@example.com  ",
          password: userData.password,
        })
        .expect(200);

      expect(response.body.user.email).toBe("test@example.com");
    });
  });
});

