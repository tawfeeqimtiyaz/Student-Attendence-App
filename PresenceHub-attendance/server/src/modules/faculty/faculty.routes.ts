// ============================================
// Faculty Routes — Protected API Endpoints
// ============================================

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { Role } from '../../shared/index.js';
import {
  markAttendanceSchema,
  examSchema,
  enterMarksSchema,
  disciplineSchema,
  createFeeSchema,
  uploadGradesSchema,
  uploadResultsSchema,
} from '../../shared/index.js';
import * as FacultyController from './faculty.controller.js';

const router = Router();

// All routes require authentication and FACULTY role
router.use(authMiddleware);
router.use(requireRole(Role.FACULTY));

// ---- Dashboard ----
router.get('/dashboard', FacultyController.getDashboard);

// ---- Sections ----
router.get('/sections', FacultyController.getSections);
router.get('/sections/:sectionId/students', FacultyController.getSectionStudents);
router.get('/sections/:sectionId/exams', FacultyController.getExamsForSection);

// ---- Exams ----
router.post('/exams', validate(examSchema), FacultyController.createExam);

// ---- Attendance ----
router.post('/attendance', validate(markAttendanceSchema), FacultyController.markAttendance);
router.get('/attendance/:sectionId', FacultyController.getAttendanceHistory);

// ---- Marks ----
router.post('/marks', validate(enterMarksSchema), FacultyController.uploadMarks);

// ---- Grades ----
router.post('/grades', validate(uploadGradesSchema), FacultyController.uploadGrades);
router.get('/grades/:sectionId', FacultyController.getGrades);

// ---- Results ----
router.post('/results', validate(uploadResultsSchema), FacultyController.uploadResults);

// ---- Discipline ----
router.post('/discipline', validate(disciplineSchema), FacultyController.fileDiscipline);
router.get('/discipline', FacultyController.getDisciplineRecords);

// ---- Fines ----
router.post('/fines', validate(createFeeSchema), FacultyController.assignFine);
router.get('/fines', FacultyController.getAssignedFines);

export const facultyRoutes = router;
