export type QuestionType = "MCQ" | "TrueFalse";

export interface Question {
  id: number;
  examId: number;
  order: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuestionData {
  examId: number;
  order: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points?: number;
}

export interface UpdateQuestionData {
  order?: number;
  type?: QuestionType;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  points?: number;
}

export interface QuestionResponse {
  id: number;
  examId: number;
  order: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  points: number;
  createdAt: Date;
  updatedAt: Date;
}