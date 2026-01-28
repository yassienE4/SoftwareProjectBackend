import express, { Request, Response } from "express";
import { checkDb } from "./lib/db-check";
import { signup, login } from "./services/AuthService";

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Body:", req.body);
  next();
});

// Auth Routes
app.post("/auth/signup", async (req: Request, res: Response) => {
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

app.post("/auth/login", async (req: Request, res: Response) => {
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
