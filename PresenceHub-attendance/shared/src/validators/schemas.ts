// ============================================
// Shared Zod Validation Schemas
// ============================================

import { z } from 'zod';
import {
  Role,
  AttendanceStatus,
  FeeStatus,
  FeeType,
  ExamType,
  DisciplineActionType,
  NotificationType,
} from '../constants/enums.js';

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().min(1, 'Email or ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.nativeEnum(Role),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ---- Department ----
export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required').max(100),
  code: z.string().min(2, 'Department code is required').max(10).toUpperCase(),
  headOfDepartment: z.string().optional(),
});

// ---- Student ----
export const createStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  rollNumber: z.string().min(1, 'Roll number is required').max(20),
  departmentId: z.string().uuid('Invalid department ID'),
  semester: z.number().int().min(1).max(8),
  section: z.string().max(5).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().max(15).optional(),
  address: z.string().max(500).optional(),
  guardianName: z.string().max(100).optional(),
  guardianPhone: z.string().max(15).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({
  email: true,
  password: true,
});

// ---- Faculty ----
export const createFacultySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  employeeId: z.string().min(1, 'Employee ID is required').max(20),
  departmentId: z.string().uuid('Invalid department ID'),
  designation: z.string().max(100).optional(),
  specialization: z.string().max(200).optional(),
  phone: z.string().max(15).optional(),
});

// ---- Course ----
export const courseSchema = z.object({
  code: z.string().min(2, 'Course code is required').max(10).toUpperCase(),
  name: z.string().min(2, 'Course name is required').max(200),
  credits: z.number().int().min(1).max(6),
  departmentId: z.string().uuid('Invalid department ID'),
  semester: z.number().int().min(1).max(8),
  description: z.string().max(1000).optional(),
});

// ---- Section ----
export const sectionSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  facultyId: z.string().uuid('Invalid faculty ID'),
  name: z.string().min(1, 'Section name is required').max(10),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  semester: z.number().int().min(1).max(8),
});

// ---- Attendance ----
export const markAttendanceSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.nativeEnum(AttendanceStatus),
      remarks: z.string().max(200).optional(),
    })
  ),
});

// ---- Exam ----
export const examSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  sectionId: z.string().uuid('Invalid section ID'),
  name: z.string().min(1, 'Exam name is required').max(100),
  type: z.nativeEnum(ExamType),
  maxMarks: z.number().int().min(1).max(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
});

// ---- Marks ----
export const enterMarksSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
  marks: z.array(
    z.object({
      studentId: z.string().uuid(),
      obtainedMarks: z.number().min(0),
      remarks: z.string().max(200).optional(),
    })
  ),
});

// ---- Fees ----
export const createFeeSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  type: z.nativeEnum(FeeType),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  semester: z.number().int().min(1).max(8),
});

export const payFeeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1),
  transactionId: z.string().min(1),
});

// ---- Discipline ----
export const disciplineSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  actionTaken: z.nativeEnum(DisciplineActionType),
  actionDetails: z.string().max(1000).optional(),
});

// ---- Grades ----
export const uploadGradesSchema = z.object({
  sectionId: z.string().uuid('Invalid section ID'),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      letterGrade: z.enum(['A+', 'A', 'B+', 'B', 'C', 'D', 'F']),
      gradePoints: z.number().min(0).max(10),
      remarks: z.string().max(200).optional(),
    })
  ).min(1, 'At least one record is required'),
});

// ---- Results ----
export const uploadResultsSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      semester: z.number().int().min(1).max(8),
      academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
      sgpa: z.number().min(0).max(10),
      cgpa: z.number().min(0).max(10),
      totalCredits: z.number().int().min(0),
      earnedCredits: z.number().int().min(0),
    })
  ).min(1, 'At least one record is required'),
});

// ---- Notification ----
export const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
  type: z.nativeEnum(NotificationType),
  recipientIds: z.array(z.string().uuid()).optional(),
  recipientRole: z.nativeEnum(Role).optional(),
  link: z.string().url().optional(),
});

// ---- Pagination ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ---- Type exports from schemas ----
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type EnterMarksInput = z.infer<typeof enterMarksSchema>;
export type CreateFeeInput = z.infer<typeof createFeeSchema>;
export type PayFeeInput = z.infer<typeof payFeeSchema>;
export type DisciplineInput = z.infer<typeof disciplineSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UploadGradesInput = z.infer<typeof uploadGradesSchema>;
export type UploadResultsInput = z.infer<typeof uploadResultsSchema>;
