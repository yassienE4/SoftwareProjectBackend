import { prisma } from "../lib/prisma";
import * as crypto from "crypto";

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  role?: "Admin" | "Instructor" | "Student";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Hash password using SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password against hash
 */
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const { email, name, password, role = "Student" } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Log in a user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
