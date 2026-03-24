import { prisma } from "../lib/prisma";
import {
  CreateQuestionData,
  QuestionResponse,
  UpdateQuestionData,
} from "../models/Question";

function toQuestionResponse(question: any): QuestionResponse {
  return {
    id: question.id,
    examId: question.examId,
    order: question.order,
    type: question.type,
    questionText: question.questionText,
    options: question.options,
    points: question.points,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

export class QuestionService {
  async getQuestionsByExamId(examId: number): Promise<QuestionResponse[]> {
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { order: "asc" },
    });

    return questions.map(toQuestionResponse);
  }

  async getQuestionById(id: number): Promise<QuestionResponse | null> {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    return question ? toQuestionResponse(question) : null;
  }

  async createQuestion(data: CreateQuestionData): Promise<QuestionResponse> {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) {
      throw new Error("Exam not found");
    }

    const question = await prisma.question.create({
      data: {
        examId: data.examId,
        order: data.order,
        type: data.type,
        questionText: data.questionText,
        options: data.options,
        correctAnswer: data.correctAnswer,
        points: data.points ?? 1,
      },
    });

    return toQuestionResponse(question);
  }

  async updateQuestion(id: number, data: UpdateQuestionData): Promise<QuestionResponse> {
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      throw new Error("Question not found");
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(data.order !== undefined && { order: data.order }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
        ...(data.points !== undefined && { points: data.points }),
      },
    });

    return toQuestionResponse(question);
  }

  async deleteQuestion(id: number): Promise<void> {
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      throw new Error("Question not found");
    }

    await prisma.question.delete({
      where: { id },
    });
  }
}
