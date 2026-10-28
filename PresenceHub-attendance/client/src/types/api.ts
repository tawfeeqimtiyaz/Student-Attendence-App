// ============================================
// API response shapes — mirror the Prisma includes/selects in server services
// ============================================

import type { AttendanceStatus, Role } from '@college-erp/shared';

type ISODate = string;

export interface PersonName {
  firstName: string;
  lastName: string;
}

export interface DepartmentRef {
  name: string;
  code: string;
}

export interface CourseRef {
  name: string;
  code: string;
}

// ---- Auth ----
export interface ProfileDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  student: null | {
    rollNumber: string;
    semester: number;
    section?: string | null;
    phone?: string | null;
    dateOfBirth?: ISODate | null;
    address?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    department: DepartmentRef & { id: string };
  };
  faculty: null | {
    employeeId: string;
    designation?: string | null;
    specialization?: string | null;
    phone?: string | null;
    department: DepartmentRef & { id: string };
  };
}

// ---- Admin ----
export interface AdminRecentUser extends PersonName {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: ISODate;
}

export interface AdminDashboard {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalCourses: number;
  totalSections: number;
  attendanceRate: number;
  pendingFees: number;
  recentUsers: AdminRecentUser[];
}

export interface AdminUser extends PersonName {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: ISODate;
  student: null | { rollNumber: string; semester: number; department: DepartmentRef };
  faculty: null | { employeeId: string; designation?: string | null; department: DepartmentRef };
}

export interface CreateUserInput extends PersonName {
  email: string;
  password: string;
  role: Role;
  departmentId?: string;
  rollNumber?: string;
  semester?: number;
  employeeId?: string;
  designation?: string;
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  _count: { students: number; faculty: number; courses: number };
}

export interface AdminCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  description?: string | null;
  departmentId: string;
  department: DepartmentRef;
  _count: { sections: number };
}

export interface CreateCourseInput {
  code: string;
  name: string;
  credits: number;
  departmentId: string;
  semester: number;
  description?: string;
}

export interface AdminSection {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
  course: CourseRef;
  faculty: { user: PersonName } | null;
  _count: { enrollments: number };
}

export interface AdminEnrollment {
  id: string;
  studentId: string;
  sectionId: string;
  createdAt: ISODate;
  student: {
    id: string;
    rollNumber: string;
    user: PersonName & { email: string };
    department: DepartmentRef;
  };
}

// ---- Faculty ----
export interface FacultyCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

export interface FacultyDashboardSection {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
  courseId: string;
  course: FacultyCourse;
  _count: { enrollments: number; exams: number; grades: number };
}

export interface FacultyDashboard {
  totalSections: number;
  totalStudents: number;
  totalExams: number;
  recentDiscipline: number;
  finesAssigned: number;
  sections: FacultyDashboardSection[];
}

export interface SectionEnrollment {
  studentId: string;
  student: {
    id: string;
    rollNumber: string;
    user: PersonName & { email: string; avatarUrl?: string | null };
  };
}

export interface FacultySection {
  id: string;
  name: string;
  academicYear: string;
  semester: number;
  courseId: string;
  course: FacultyCourse;
  enrollments: SectionEnrollment[];
  _count: { enrollments: number; exams: number };
}

export interface FacultyExam {
  id: string;
  name: string;
  type: string;
  maxMarks: number;
  date: ISODate;
  course?: CourseRef;
}

export interface AttendanceEntry {
  id: string;
  studentId: string;
  sectionId: string;
  date: ISODate;
  status: AttendanceStatus;
  remarks?: string | null;
  student: { rollNumber: string; user: PersonName };
}

export interface AttendanceInput {
  sectionId: string;
  date: string;
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}

export interface GradeEntry {
  id: string;
  studentId: string;
  letterGrade: string;
  gradePoints: number;
  remarks?: string | null;
  student: { rollNumber: string; user: PersonName };
}

export interface DisciplineEntry {
  id: string;
  studentId: string;
  incidentDate: ISODate;
  description: string;
  actionTaken: string;
  actionDetails?: string | null;
  isResolved: boolean;
  createdAt: ISODate;
  student?: { rollNumber: string; user: PersonName };
}

export interface FineEntry {
  id: string;
  amount: number;
  paidAmount: number;
  dueDate: ISODate;
  status: string;
  academicYear: string;
  semester: number;
  createdAt: ISODate;
  student: { rollNumber: string; user: PersonName };
}

// ---- Student ----
export interface StudentMark {
  id: string;
  obtainedMarks: number;
  remarks?: string | null;
  createdAt: ISODate;
  exam: { id: string; name: string; type: string; maxMarks: number; date: ISODate; course: CourseRef };
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'ANNOUNCEMENT';
  isRead: boolean;
  link?: string | null;
  createdAt: ISODate;
}

export interface StudentDashboard {
  attendancePercentage: number;
  latestSgpa: number | null;
  pendingFees: number;
  recentMarks: StudentMark[];
  notifications: StudentNotification[];
}

export interface StudentAttendanceRecord {
  id: string;
  date: ISODate;
  status: AttendanceStatus;
  remarks?: string | null;
  sectionId: string;
  section: { id: string; name: string; course: CourseRef & { id: string } };
}

export interface StudentFee {
  id: string;
  type: string;
  amount: number;
  paidAmount: number;
  dueDate: ISODate;
  status: string;
  academicYear: string;
  semester: number;
}

export interface StudentResult {
  id: string;
  semester: number;
  academicYear: string;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  earnedCredits: number;
  isPublished: boolean;
}

export type StudentDiscipline = DisciplineEntry;
