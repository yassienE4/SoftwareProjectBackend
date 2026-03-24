import express, { Request, Response } from "express";
import cors from "cors";
import { checkDb } from "./lib/db-check";
import { signup, login } from "./services/AuthService";
import { authenticateToken, authorizeRole, AuthRequest } from "./lib/auth-middleware";
import { refreshAccessToken } from "./lib/jwt";
import { UserService } from "./services/UserService";
import { CreateUserRequest, UpdateUserRequest } from "./models/User";
import { ExamService } from "./services/ExamService";
import { QuestionService } from "./services/QuestionService";
import { ExamAttemptService } from "./services/ExamAttemptService";
import crypto from "crypto";

const app = express();
const PORT = 8080;
const userService = new UserService();
const examService = new ExamService();
const questionService = new QuestionService();
const examAttemptService = new ExamAttemptService();

function toDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parsedDate = new Date(String(value));
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
}

async function loadExamOrFail(examId: number, res: Response) {
  const exam = await examService.getExamById(examId);

  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return null;
  }

  return exam;
}

function canManageExam(req: AuthRequest, instructorId: number): boolean {
  return req.user?.role === "Admin" || req.user?.id === instructorId;
}

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
      const userId = parseInt(String(req.params.id), 10);

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
      const userId = parseInt(String(req.params.id), 10);

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
      const userId = parseInt(String(req.params.id), 10);

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

// Exam Management Routes

app.get("/api/exams", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === "Admin") {
      const exams = await examService.getAllExams();
      res.status(200).json({ success: true, data: exams });
      return;
    }

    if (req.user?.role === "Instructor") {
      const exams = await examService.getAllExams(req.user.id);
      res.status(200).json({ success: true, data: exams });
      return;
    }

    const exams = await examService.getAllExams(undefined, "Published");
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch exams";
    res.status(500).json({ error: message });
  }
});

app.post(
  "/api/exams",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body || {};
      const title = body.title;
      const durationMinutes = Number(body.durationMinutes);

      if (!title || !durationMinutes || Number.isNaN(durationMinutes)) {
        res.status(400).json({ error: "Title and durationMinutes are required" });
        return;
      }

      const exam = await examService.createExam({
        title,
        description: body.description,
        instructorId:
          req.user?.role === "Admin" && body.instructorId
            ? Number(body.instructorId)
            : req.user?.id ?? 0,
        durationMinutes,
        availabilityStart: toDate(body.availabilityStart),
        availabilityEnd: toDate(body.availabilityEnd),
        status: body.status,
      });

      res.status(201).json({ success: true, data: exam });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create exam";
      res.status(400).json({ error: message });
    }
  }
);

app.get("/api/exams/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const examId = parseInt(String(req.params.id), 10);

    if (Number.isNaN(examId)) {
      res.status(400).json({ error: "Invalid exam ID" });
      return;
    }

    const exam = await loadExamOrFail(examId, res);
    if (!exam) {
      return;
    }

    if (req.user?.role === "Student" && exam.status !== "Published") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (req.user?.role === "Instructor" && !canManageExam(req, exam.instructorId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch exam";
    res.status(500).json({ error: message });
  }
});

app.patch(
  "/api/exams/:id",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);

      if (Number.isNaN(examId)) {
        res.status(400).json({ error: "Invalid exam ID" });
        return;
      }

      const existingExam = await loadExamOrFail(examId, res);
      if (!existingExam) {
        return;
      }

      if (!canManageExam(req, existingExam.instructorId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const body = req.body || {};
      const exam = await examService.updateExam(examId, {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.durationMinutes !== undefined && { durationMinutes: Number(body.durationMinutes) }),
        ...(body.availabilityStart !== undefined && { availabilityStart: toDate(body.availabilityStart) ?? null }),
        ...(body.availabilityEnd !== undefined && { availabilityEnd: toDate(body.availabilityEnd) ?? null }),
        ...(body.status !== undefined && { status: body.status }),
      });

      res.status(200).json({ success: true, data: exam });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update exam";
      res.status(400).json({ error: message });
    }
  }
);

app.delete(
  "/api/exams/:id",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);

      if (Number.isNaN(examId)) {
        res.status(400).json({ error: "Invalid exam ID" });
        return;
      }

      const existingExam = await loadExamOrFail(examId, res);
      if (!existingExam) {
        return;
      }

      if (!canManageExam(req, existingExam.instructorId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await examService.deleteExam(examId);
      res.status(200).json({ success: true, message: "Exam deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete exam";
      res.status(400).json({ error: message });
    }
  }
);

// Nested question management: /api/exams/:id/questions

app.get("/api/exams/:id/questions", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const examId = parseInt(String(req.params.id), 10);

    if (Number.isNaN(examId)) {
      res.status(400).json({ error: "Invalid exam ID" });
      return;
    }

    const exam = await loadExamOrFail(examId, res);
    if (!exam) {
      return;
    }

    if (req.user?.role === "Student" && exam.status !== "Published") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (req.user?.role === "Instructor" && !canManageExam(req, exam.instructorId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const questions = await questionService.getQuestionsByExamId(examId);
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch questions";
    res.status(500).json({ error: message });
  }
});

app.post(
  "/api/exams/:id/questions",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);

      if (Number.isNaN(examId)) {
        res.status(400).json({ error: "Invalid exam ID" });
        return;
      }

      const exam = await loadExamOrFail(examId, res);
      if (!exam) {
        return;
      }

      if (!canManageExam(req, exam.instructorId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const body = req.body || {};
      const question = await questionService.createQuestion({
        examId,
        order: Number(body.order),
        type: body.type,
        questionText: body.questionText,
        options: Array.isArray(body.options) ? body.options : [],
        correctAnswer: body.correctAnswer,
        points: body.points !== undefined ? Number(body.points) : undefined,
      });

      res.status(201).json({ success: true, data: question });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create question";
      res.status(400).json({ error: message });
    }
  }
);

app.patch(
  "/api/exams/:id/questions/:questionId",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);
      const questionId = parseInt(String(req.params.questionId), 10);

      if (Number.isNaN(examId) || Number.isNaN(questionId)) {
        res.status(400).json({ error: "Invalid exam or question ID" });
        return;
      }

      const exam = await loadExamOrFail(examId, res);
      if (!exam) {
        return;
      }

      if (!canManageExam(req, exam.instructorId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const existingQuestion = await questionService.getQuestionById(questionId);
      if (!existingQuestion || existingQuestion.examId !== examId) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      const body = req.body || {};
      const question = await questionService.updateQuestion(questionId, {
        ...(body.order !== undefined && { order: Number(body.order) }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.questionText !== undefined && { questionText: body.questionText }),
        ...(body.options !== undefined && { options: body.options }),
        ...(body.correctAnswer !== undefined && { correctAnswer: body.correctAnswer }),
        ...(body.points !== undefined && { points: Number(body.points) }),
      });

      res.status(200).json({ success: true, data: question });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update question";
      res.status(400).json({ error: message });
    }
  }
);

app.delete(
  "/api/exams/:id/questions/:questionId",
  authenticateToken,
  authorizeRole("Instructor", "Admin"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);
      const questionId = parseInt(String(req.params.questionId), 10);

      if (Number.isNaN(examId) || Number.isNaN(questionId)) {
        res.status(400).json({ error: "Invalid exam or question ID" });
        return;
      }

      const exam = await loadExamOrFail(examId, res);
      if (!exam) {
        return;
      }

      if (!canManageExam(req, exam.instructorId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const existingQuestion = await questionService.getQuestionById(questionId);
      if (!existingQuestion || existingQuestion.examId !== examId) {
        res.status(404).json({ error: "Question not found" });
        return;
      }

      await questionService.deleteQuestion(questionId);
      res.status(200).json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete question";
      res.status(400).json({ error: message });
    }
  }
);

// Student exam attempts

app.post(
  "/api/exams/:id/start",
  authenticateToken,
  authorizeRole("Student"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);

      if (Number.isNaN(examId)) {
        res.status(400).json({ error: "Invalid exam ID" });
        return;
      }

      const exam = await loadExamOrFail(examId, res);
      if (!exam) {
        return;
      }

      const now = new Date();
      if (exam.status !== "Published") {
        res.status(403).json({ error: "Exam is not available" });
        return;
      }

      if (exam.availabilityStart && now < exam.availabilityStart) {
        res.status(403).json({ error: "Exam has not opened yet" });
        return;
      }

      if (exam.availabilityEnd && now > exam.availabilityEnd) {
        res.status(403).json({ error: "Exam has closed" });
        return;
      }

      const attempt = await examAttemptService.startAttempt({
        examId,
        studentId: req.user?.id ?? 0,
      });

      res.status(201).json({ success: true, data: attempt });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start attempt";
      res.status(400).json({ error: message });
    }
  }
);

app.post(
  "/api/exams/:id/submit",
  authenticateToken,
  authorizeRole("Student"),
  async (req: AuthRequest, res: Response) => {
    try {
      const examId = parseInt(String(req.params.id), 10);

      if (Number.isNaN(examId)) {
        res.status(400).json({ error: "Invalid exam ID" });
        return;
      }

      const body = req.body || {};
      if (!body.answers || typeof body.answers !== "object") {
        res.status(400).json({ error: "answers are required" });
        return;
      }

      const attempt = await examAttemptService.submitAttemptForExam(
        examId,
        req.user?.id ?? 0,
        body.answers
      );

      res.status(200).json({ success: true, data: attempt });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit attempt";
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
