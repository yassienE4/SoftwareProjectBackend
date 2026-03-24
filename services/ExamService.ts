import { prisma } from "../lib/prisma";
import { CreateExamData, ExamResponse, UpdateExamData } from "../models/Exam";

function toExamResponse(exam: any): ExamResponse {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    instructorId: exam.instructorId,
    durationMinutes: exam.durationMinutes,
    availabilityStart: exam.availabilityStart,
    availabilityEnd: exam.availabilityEnd,
    status: exam.status,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}

export class ExamService {
  async getAllExams(instructorId?: number): Promise<ExamResponse[]> {
    const exams = await prisma.exam.findMany({
      where: instructorId ? { instructorId } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return exams.map(toExamResponse);
  }

  async getExamById(id: number): Promise<ExamResponse | null> {
    const exam = await prisma.exam.findUnique({
      where: { id },
    });

    return exam ? toExamResponse(exam) : null;
  }

  async createExam(data: CreateExamData): Promise<ExamResponse> {
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId },
    });

    if (!instructor) {
      throw new Error("Instructor not found");
    }

    if (instructor.role !== "Instructor" && instructor.role !== "Admin") {
      throw new Error("Exam owner must be an instructor or admin");
    }

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        instructorId: data.instructorId,
        durationMinutes: data.durationMinutes,
        availabilityStart: data.availabilityStart,
        availabilityEnd: data.availabilityEnd,
        status: data.status,
      },
    });

    return toExamResponse(exam);
  }

  async updateExam(id: number, data: UpdateExamData): Promise<ExamResponse> {
    const existingExam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      throw new Error("Exam not found");
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.availabilityStart !== undefined && { availabilityStart: data.availabilityStart }),
        ...(data.availabilityEnd !== undefined && { availabilityEnd: data.availabilityEnd }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return toExamResponse(exam);
  }

  async deleteExam(id: number): Promise<void> {
    const existingExam = await prisma.exam.findUnique({
      where: { id },
    });

    if (!existingExam) {
      throw new Error("Exam not found");
    }

    await prisma.exam.delete({
      where: { id },
    });
  }
}
