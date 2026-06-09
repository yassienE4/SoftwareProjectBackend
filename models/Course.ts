export interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseData {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCourseData {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CourseResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollUserData {
  courseId: number;
  userId: number;
}

export interface CourseEnrollmentResponse {
  id: number;
  courseId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}