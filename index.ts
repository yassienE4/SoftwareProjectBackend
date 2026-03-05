import express, { Request, Response } from "express";
import cors from "cors";
import { checkDb } from "./lib/db-check";
import { signup, login } from "./services/AuthService";
import { authenticateToken, authorizeRole, AuthRequest } from "./lib/auth-middleware";
import { refreshAccessToken } from "./lib/jwt";
import { UserService } from "./services/UserService";
import { CreateUserRequest, UpdateUserRequest } from "./models/User";
import crypto from "crypto";

const app = express();
const PORT = 8080;
const userService = new UserService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Body:", req.body);
  next();
});

// Auth Routes
app.post("/api/auth/signup", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { email, name, password, role } = body;

    // Validate input
    if (!email || !name || !password) {
      res.status(400).json({ error: "Email, name, and password are required" });
      return;
    }

    const user = await signup({ email, name, password, role });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    res.status(400).json({ error: message });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await login({ email, password });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
});

app.get("/api/home", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Home API!" });
});

// Protected route example - requires authentication
app.get("/api/profile", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: "This is your profile",
    user: req.user,
  });
});

// Protected route example - requires Admin role
app.get(
  "/api/admin/dashboard",
  authenticateToken,
  authorizeRole("Admin"),
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Welcome to admin dashboard",
      admin: req.user,
    });
  }
);

// Refresh token endpoint
app.post("/api/auth/refresh", (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const tokens = refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    res.status(401).json({ error: message });
  }
});

// User Management Routes

// GET /api/users - List all users (Admin only)
app.get(
  "/api/users",
  authenticateToken,
  authorizeRole("Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.query;
      const roleFilter = role as "Admin" | "Instructor" | "Student" | undefined;

      const users = await userService.getAllUsers(roleFilter);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch users";
      res.status(500).json({ error: message });
    }
  }
);

// GET /api/users/:id - Get user by ID (Admin or self)
app.get(
  "/api/users/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      // Check if user is admin or requesting their own profile
      if (req.user?.role !== "Admin" && req.user?.id !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const user = await userService.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch user";
      res.status(500).json({ error: message });
    }
  }
);

// POST /api/users - Create new user (Admin only)
app.post(
  "/api/users",
  authenticateToken,
  authorizeRole("Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, name, password, role }: CreateUserRequest = req.body;

      // Validate input
      if (!email || !name || !password) {
        res.status(400).json({ error: "Email, name, and password are required" });
        return;
      }

      // Hash password
      const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

      const user = await userService.createUser({
        email,
        name,
        passwordHash,
        role: role || "Student",
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      res.status(400).json({ error: message });
    }
  }
);

// PATCH /api/users/:id - Update user (Admin only)
app.patch(
  "/api/users/:id",
  authenticateToken,
  authorizeRole("Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      const { email, name, role, password }: UpdateUserRequest = req.body;

      // Update user basic info
      const user = await userService.updateUser(userId, {
        email,
        name,
        role,
      });

      // If password provided, update it separately (admin override)
      if (password) {
        await userService.updateUserPassword(userId, password);
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      res.status(400).json({ error: message });
    }
  }
);

// DELETE /api/users/:id - Delete user (Admin only)
app.delete(
  "/api/users/:id",
  authenticateToken,
  authorizeRole("Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      await userService.deleteUser(userId);

      res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      res.status(400).json({ error: message });
    }
  }
);

async function start() {
  await checkDb(); // 👈 ensures DB is reachable before starting

  app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
