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
}
