import { User } from "../../models/user.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from "../helpers/mongodb.js";

describe("User Model", () => {
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

  describe("User Creation", () => {
    it("should create a new user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).toBeDefined();
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.createdAt).toBeInstanceOf(Date);
    });

    it("should automatically hash password before saving", async () => {
      const userData = {
        name: "Test User",
        email: "test2@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(20); // bcrypt hash is long
    });

    it("should set default createdAt date", async () => {
      const userData = {
        name: "Test User",
        email: "test3@example.com",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.createdAt).toBeInstanceOf(Date);
      const now = new Date();
      const timeDiff = Math.abs(now.getTime() - savedUser.createdAt.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it("should trim name and email", async () => {
      const userData = {
        name: "  Test User  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe("Test User");
      expect(savedUser.email).toBe("test@example.com"); // Also lowercase
    });

    it("should convert email to lowercase", async () => {
      const userData = {
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe("test@example.com");
    });
  });

  describe("User Validation", () => {
    it("should require name field", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it("should require email field", async () => {
      const userData = {
        name: "Test User",
        password: "password123",
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it("should require password field", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it("should reject invalid email format", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it("should reject password shorter than 6 characters", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "12345",
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it("should enforce unique email constraint", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe("Password Comparison", () => {
    it("should compare password correctly", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await user.save();

      // Need to select password field for comparison
      const userWithPassword = await User.findById(user._id).select(
        "+password"
      );
      expect(userWithPassword).not.toBeNull();

      const isMatch = await userWithPassword!.comparePassword("password123");
      expect(isMatch).toBe(true);

      const isNotMatch = await userWithPassword!.comparePassword(
        "wrongpassword"
      );
      expect(isNotMatch).toBe(false);
    });
  });

  describe("Password Field Selection", () => {
    it("should not include password in query by default", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findById(user._id);
      expect(foundUser).not.toBeNull();
      expect(foundUser!.password).toBeUndefined();
    });

    it("should include password when explicitly selected", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findById(user._id).select("+password");
      expect(foundUser).not.toBeNull();
      expect(foundUser!.password).toBeDefined();
    });
  });

  describe("Password Hashing on Update", () => {
    it("should hash password when password is modified", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await user.save();

      const oldPassword = user.password;

      // Update password
      user.password = "newpassword123";
      await user.save();

      const updatedUser = await User.findById(user._id).select("+password");
      expect(updatedUser!.password).not.toBe(oldPassword);
      expect(updatedUser!.password).not.toBe("newpassword123"); // Should be hashed
    });

    it("should not re-hash password when other fields are modified", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const user = new User(userData);
      await user.save();

      const oldPassword = user.password;

      // Update name only
      user.name = "Updated Name";
      await user.save();

      const updatedUser = await User.findById(user._id).select("+password");
      expect(updatedUser!.password).toBe(oldPassword);
    });
  });
});
