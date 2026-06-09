export type AttemptStatus = "InProgress" | "Submitted";

export type AnswerValue = string | number | boolean | string[] | null;
export type ExamAnswers = Record<string, AnswerValue>;

export interface ExamAttempt {
  id: number;
  examId: number;
  studentId: number;
  status: AttemptStatus;
  answers: ExamAnswers | null;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamAttemptData {
  examId: number;
  studentId: number;
  answers?: ExamAnswers;
}

export interface UpdateExamAttemptData {
  status?: AttemptStatus;
  answers?: ExamAnswers;
  score?: number | null;
  submittedAt?: Date | null;
}

export interface ExamAttemptResponse {
  id: number;
  examId: number;
  studentId: number;
  status: AttemptStatus;
  answers: ExamAnswers | null;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}