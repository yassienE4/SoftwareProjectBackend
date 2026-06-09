import { prisma } from "../lib/prisma";
import {
  CourseEnrollmentResponse,
  CourseResponse,
  CreateCourseData,
  EnrollUserData,
  UpdateCourseData,
} from "../models/Course";

function toCourseResponse(course: any): CourseResponse {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    description: course.description,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function toEnrollmentResponse(enrollment: any): CourseEnrollmentResponse {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    userId: enrollment.userId,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}

export class CourseService {
  async getAllCourses(): Promise<CourseResponse[]> {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });

    return courses.map(toCourseResponse);
  }

  async getCourseById(id: number): Promise<CourseResponse | null> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    return course ? toCourseResponse(course) : null;
  }

  async getCourseByCode(code: string): Promise<CourseResponse | null> {
    const course = await prisma.course.findUnique({
      where: { code },
    });

    return course ? toCourseResponse(course) : null;
  }

  async createCourse(data: CreateCourseData): Promise<CourseResponse> {
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existingCourse) {
      throw new Error("Course code already exists");
    }

    const course = await prisma.course.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
      },
    });

    return toCourseResponse(course);
  }

  async updateCourse(id: number, data: UpdateCourseData): Promise<CourseResponse> {
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new Error("Course not found");
    }

    if (data.code && data.code !== existingCourse.code) {
      const codeTaken = await prisma.course.findUnique({
        where: { code: data.code },
      });

      if (codeTaken) {
        throw new Error("Course code already exists");
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return toCourseResponse(course);
  }

  async enrollUser(data: EnrollUserData): Promise<CourseEnrollmentResponse> {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: data.courseId,
          userId: data.userId,
        },
      },
    });

    if (existingEnrollment) {
      return toEnrollmentResponse(existingEnrollment);
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: data.courseId,
        userId: data.userId,
      },
    });

    return toEnrollmentResponse(enrollment);
  }

  async unenrollUser(courseId: number, userId: number): Promise<void> {
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (!existingEnrollment) {
      throw new Error("Enrollment not found");
    }

    await prisma.courseEnrollment.delete({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });
  }

  async isUserEnrolled(courseId: number, userId: number): Promise<boolean> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    return Boolean(enrollment);
  }

  async getUsersForCourse(courseId: number): Promise<CourseEnrollmentResponse[]> {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map(toEnrollmentResponse);
  }

  async getCoursesForUser(userId: number): Promise<CourseResponse[]> {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map((enrollment) => toCourseResponse(enrollment.course));
  }
}