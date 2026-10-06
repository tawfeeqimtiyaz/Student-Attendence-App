// ============================================
// Shared TypeScript Types — College ERP
// ============================================

import {
  Role,
  AttendanceStatus,
  FeeStatus,
  FeeType,
  ExamType,
  DisciplineActionType,
  NotificationType,
} from '../constants/enums.js';

// ---- Base ----
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Auth ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

// ---- User ----
export interface UserProfile extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
}

// ---- Department ----
export interface Department extends BaseEntity {
  name: string;
  code: string;
  headOfDepartment?: string;
}

// ---- Student ----
export interface Student extends BaseEntity {
  userId: string;
  rollNumber: string;
  departmentId: string;
  semester: number;
  section?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  user?: UserProfile;
  department?: Department;
}

// ---- Faculty ----
export interface Faculty extends BaseEntity {
  userId: string;
  employeeId: string;
  departmentId: string;
  designation?: string;
  specialization?: string;
  phone?: string;
  user?: UserProfile;
  department?: Department;
}

// ---- Course ----
export interface Course extends BaseEntity {
  code: string;
  name: string;
  credits: number;
  departmentId: string;
  semester: number;
  description?: string;
  department?: Department;
}

// ---- Section ----
export interface Section extends BaseEntity {
  courseId: string;
  facultyId: string;
  name: string;
  academicYear: string;
  semester: number;
  course?: Course;
  faculty?: Faculty;
}

// ---- Enrollment ----
export interface Enrollment extends BaseEntity {
  studentId: string;
  sectionId: string;
  student?: Student;
  section?: Section;
}

// ---- Attendance ----
export interface AttendanceRecord extends BaseEntity {
  studentId: string;
  sectionId: string;
  date: string;
  status: AttendanceStatus;
  markedById: string;
  remarks?: string;
  student?: Student;
  section?: Section;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

// ---- Exam & Marks ----
export interface Exam extends BaseEntity {
  courseId: string;
  sectionId: string;
  name: string;
  type: ExamType;
  maxMarks: number;
  date: string;
  course?: Course;
  section?: Section;
}

export interface Mark extends BaseEntity {
  studentId: string;
  examId: string;
  obtainedMarks: number;
  remarks?: string;
  student?: Student;
  exam?: Exam;
}

// ---- Fees ----
export interface Fee extends BaseEntity {
  studentId: string;
  type: FeeType;
  amount: number;
  dueDate: string;
  status: FeeStatus;
  paidAmount: number;
  academicYear: string;
  semester: number;
  student?: Student;
}

export interface FeePayment extends BaseEntity {
  feeId: string;
  amount: number;
  paymentDate: string;
  transactionId: string;
  paymentMethod: string;
  fee?: Fee;
}

// ---- Results ----
export interface Result extends BaseEntity {
  studentId: string;
  semester: number;
  academicYear: string;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  earnedCredits: number;
  isPublished: boolean;
  student?: Student;
}

// ---- Discipline ----
export interface DisciplineRecord extends BaseEntity {
  studentId: string;
  reportedById: string;
  incidentDate: string;
  description: string;
  actionTaken: DisciplineActionType;
  actionDetails?: string;
  isResolved: boolean;
  student?: Student;
  reportedBy?: UserProfile;
}

// ---- Grades ----
export interface Grade extends BaseEntity {
  studentId: string;
  sectionId: string;
  letterGrade: string;
  gradePoints: number;
  remarks?: string;
  student?: Student;
  section?: Section;
}

// ---- Notifications ----
export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
}

// ---- API Response Wrappers ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ---- Dashboard Stats ----
export interface AdminDashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalDepartments: number;
  pendingFees: number;
  todayAttendanceRate: number;
  recentNotifications: Notification[];
}

export interface FacultyDashboardStats {
  totalSections: number;
  totalStudents: number;
  todayClasses: number;
  pendingMarksEntry: number;
  attendanceToday: AttendanceSummary[];
}

export interface StudentDashboardStats {
  currentSemester: number;
  enrolledCourses: number;
  attendancePercentage: number;
  cgpa: number;
  pendingFees: number;
  upcomingExams: Exam[];
  recentNotifications: Notification[];
}
