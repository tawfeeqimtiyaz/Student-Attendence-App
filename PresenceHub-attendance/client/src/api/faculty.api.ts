// ============================================
// Faculty API — HTTP Client Layer
// ============================================

import type { ApiResponse } from '@college-erp/shared';
import api, { unwrap } from './axios';
import type {
  AttendanceEntry,
  AttendanceInput,
  DisciplineEntry,
  FacultyDashboard,
  FacultyExam,
  FacultySection,
  FineEntry,
  GradeEntry,
} from '../types/api';

export const facultyApi = {
  // Dashboard
  getDashboard: () => api.get<ApiResponse<FacultyDashboard>>('/faculty/dashboard').then(unwrap),

  // Sections (includes enrolled students)
  getSections: () => api.get<ApiResponse<FacultySection[]>>('/faculty/sections').then(unwrap),
  getExamsForSection: (sectionId: string) =>
    api.get<ApiResponse<FacultyExam[]>>(`/faculty/sections/${sectionId}/exams`).then(unwrap),

  // Exams — the validator requires courseId alongside sectionId
  createExam: (data: {
    courseId: string;
    sectionId: string;
    name: string;
    type: string;
    maxMarks: number;
    date: string;
  }) => api.post<ApiResponse<FacultyExam>>('/faculty/exams', data).then(unwrap),

  // Attendance
  markAttendance: (data: AttendanceInput) => api.post('/faculty/attendance', data),
  getAttendanceHistory: (sectionId: string, date?: string) =>
    api
      .get<ApiResponse<AttendanceEntry[]>>(`/faculty/attendance/${sectionId}`, { params: date ? { date } : {} })
      .then(unwrap),

  // Marks
  uploadMarks: (data: {
    examId: string;
    records: { studentId: string; obtainedMarks: number; remarks?: string }[];
  }) => api.post('/faculty/marks', data),

  // Grades
  uploadGrades: (data: {
    sectionId: string;
    records: { studentId: string; letterGrade: string; gradePoints: number; remarks?: string }[];
  }) => api.post('/faculty/grades', data),
  getGrades: (sectionId: string) =>
    api.get<ApiResponse<GradeEntry[]>>(`/faculty/grades/${sectionId}`).then(unwrap),

  // Results
  uploadResults: (data: {
    records: {
      studentId: string;
      semester: number;
      academicYear: string;
      sgpa: number;
      cgpa: number;
      totalCredits: number;
      earnedCredits: number;
    }[];
  }) => api.post('/faculty/results', data),

  // Discipline
  fileDiscipline: (data: {
    studentId: string;
    description: string;
    actionTaken: string;
    incidentDate: string;
    actionDetails?: string;
  }) => api.post('/faculty/discipline', data),
  getDisciplineRecords: () => api.get<ApiResponse<DisciplineEntry[]>>('/faculty/discipline').then(unwrap),

  // Fines — recorded as fees of type FINE
  assignFine: (data: {
    studentId: string;
    amount: number;
    dueDate: string;
    academicYear: string;
    semester: number;
  }) => api.post('/faculty/fines', { ...data, type: 'FINE' }),
  getAssignedFines: () => api.get<ApiResponse<FineEntry[]>>('/faculty/fines').then(unwrap),
};
