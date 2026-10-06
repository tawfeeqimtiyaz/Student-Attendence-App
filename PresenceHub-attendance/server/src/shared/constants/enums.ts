// ============================================
// Role & Status Enums
// ============================================

export enum Role {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum FeeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export enum FeeType {
  TUITION = 'TUITION',
  HOSTEL = 'HOSTEL',
  LIBRARY = 'LIBRARY',
  LAB = 'LAB',
  EXAM = 'EXAM',
  OTHER = 'OTHER',
}

export enum ExamType {
  QUIZ = 'QUIZ',
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL',
  ASSIGNMENT = 'ASSIGNMENT',
  PRACTICAL = 'PRACTICAL',
}

export enum DisciplineActionType {
  WARNING = 'WARNING',
  FINE = 'FINE',
  SUSPENSION = 'SUSPENSION',
  EXPULSION = 'EXPULSION',
  COMMUNITY_SERVICE = 'COMMUNITY_SERVICE',
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  URGENT = 'URGENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum Semester {
  SEM_1 = 1,
  SEM_2 = 2,
  SEM_3 = 3,
  SEM_4 = 4,
  SEM_5 = 5,
  SEM_6 = 6,
  SEM_7 = 7,
  SEM_8 = 8,
}
