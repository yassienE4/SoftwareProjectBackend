export type ExamStatus = "Draft" | "Published" | "Closed";

export interface Exam {
  id: number;
  title: string;
  description: string | null;
  instructorId: number;
  durationMinutes: number;
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamData {
  title: string;
  description?: string;
  instructorId: number;
  durationMinutes: number;
  availabilityStart?: Date;
  availabilityEnd?: Date;
  status?: ExamStatus;
}

export interface UpdateExamData {
  title?: string;
  description?: string;
  durationMinutes?: number;
  availabilityStart?: Date | null;
  availabilityEnd?: Date | null;
  status?: ExamStatus;
}

export interface ExamResponse {
  id: number;
  title: string;
  description: string | null;
  instructorId: number;
  durationMinutes: number;
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}