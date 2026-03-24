import { UserRole } from "../generated/prisma/client";
import { CreateUserData, UpdateUserData, UserResponse } from "../models/User";
import crypto from "crypto";
import { prisma } from "../lib/prisma";

/**
 * Hash password using SHA-256
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Convert database user to UserResponse (without password)
 */
function toUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserService {
  /**
   * Get all users with optional role filter
   */
  async getAllUsers(roleFilter?: UserRole): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      where: roleFilter ? { role: roleFilter } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return users.map(toUserResponse);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? toUserResponse(user) : null;
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    });

    return toUserResponse(user);
  }

  /**
   * Update user (with admin override for password)
   */
  async updateUser(id: number, data: UpdateUserData): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // If email is being updated, check it's not taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailTaken) {
        throw new Error("Email already in use");
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role }),
      },
    });

    return toUserResponse(user);
  }

  /**
   * Update user password (admin override)
   */
  async updateUserPassword(id: number, newPassword: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashPassword(newPassword),
      },
    });
  }

  /**
   * Delete user (hard delete)
   */
  async deleteUser(id: number): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}
