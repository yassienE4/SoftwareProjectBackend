export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  role: "Admin" | "Instructor" | "Student";
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "Admin" | "Instructor" | "Student";

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string; // Admin can update user password
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole; // Optional, defaults to Student
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string;
}
