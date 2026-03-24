import { prisma } from "../lib/prisma";
import {
  CreateExamAttemptData,
  ExamAnswers,
  ExamAttemptResponse,
  UpdateExamAttemptData,
} from "../models/ExamAttempt";

function toExamAttemptResponse(attempt: any): ExamAttemptResponse {
  return {
    id: attempt.id,
    examId: attempt.examId,
    studentId: attempt.studentId,
    status: attempt.status,
    answers: attempt.answers,
    score: attempt.score,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
}

function calculateScore(questionSet: any[], answers: ExamAnswers): number {
  return questionSet.reduce((total, question) => {
    const answer = answers[String(question.id)];
    if (answer === undefined || answer === null) {
      return total;
    }

    if (String(answer) === String(question.correctAnswer)) {
      return total + question.points;
    }

    return total;
  }, 0);
}

export class ExamAttemptService {
  async startAttempt(data: CreateExamAttemptData): Promise<ExamAttemptResponse> {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    const student = await prisma.user.findUnique({
      where: { id: data.studentId },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    if (student.role !== "Student") {
      throw new Error("Only students can start exam attempts");
    }

    const existingAttempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: data.studentId,
        },
      },
    });

    if (existingAttempt) {
      throw new Error("Student has already started this exam");
    }

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: data.examId,
        studentId: data.studentId,
        ...(data.answers !== undefined && { answers: data.answers }),
      },
    });

    return toExamAttemptResponse(attempt);
  }

  async submitAttempt(
    attemptId: number,
    studentId: number,
    answers: ExamAnswers
  ): Promise<ExamAttemptResponse> {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error("Attempt not found");
    }

    if (attempt.studentId !== studentId) {
      throw new Error("Access denied");
    }

    if (attempt.status === "Submitted") {
      throw new Error("Attempt already submitted");
    }

    const score = calculateScore(attempt.exam.questions, answers);

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: "Submitted",
        answers,
        score,
        submittedAt: new Date(),
      },
    });

    return toExamAttemptResponse(updatedAttempt);
  }

  async updateAttempt(id: number, data: UpdateExamAttemptData): Promise<ExamAttemptResponse> {
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: { id },
    });

    if (!existingAttempt) {
      throw new Error("Attempt not found");
    }

    const attempt = await prisma.examAttempt.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.answers !== undefined && { answers: data.answers }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.submittedAt !== undefined && { submittedAt: data.submittedAt }),
      },
    });

    return toExamAttemptResponse(attempt);
  }

  async getAttemptById(id: number): Promise<ExamAttemptResponse | null> {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id },
    });

    return attempt ? toExamAttemptResponse(attempt) : null;
  }

  async deleteAttempt(id: number): Promise<void> {
    const existingAttempt = await prisma.examAttempt.findUnique({
      where: { id },
    });

    if (!existingAttempt) {
      throw new Error("Attempt not found");
    }

    await prisma.examAttempt.delete({
      where: { id },
    });
  }
}
