import { prisma } from "../lib/prisma";
import { generateTokens, TokenResponse } from "../lib/jwt";
import * as crypto from "crypto";
import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  AuthResponseWithToken,
} from "../models/Auth";

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
export async function signup(
  data: SignupRequest
): Promise<AuthResponseWithToken> {
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

  // Generate tokens
  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ...tokens,
  };
}

/**
 * Log in a user
 */
export async function login(data: LoginRequest): Promise<AuthResponseWithToken> {
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

  // Generate tokens
  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ...tokens,
  };
}
