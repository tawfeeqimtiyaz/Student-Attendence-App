// ============================================
// Admin Routes — Protected API Endpoints
// ============================================

import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { Role } from '../../shared/index.js';
import * as AdminController from './admin.controller.js';

const router = Router();

// All routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(requireRole(Role.ADMIN));

// ---- Dashboard ----
router.get('/dashboard', AdminController.getDashboard);

// ---- Users ----
router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.patch('/users/:userId/toggle-status', AdminController.toggleUserStatus);

// ---- Departments ----
router.get('/departments', AdminController.listDepartments);
router.post('/departments', AdminController.createDepartment);

// ---- Courses ----
router.get('/courses', AdminController.listCourses);
router.post('/courses', AdminController.createCourse);

// ---- Sections ----
router.get('/sections', AdminController.listSections);
router.post('/sections', AdminController.createSection);
router.post('/sections/enroll', AdminController.enrollStudent);

// ---- Enrollments ----
router.get('/enrollments', AdminController.listEnrollments);
router.post('/enrollments/bulk', AdminController.enrollDepartmentStudents);
router.delete('/enrollments/:studentId/:sectionId', AdminController.removeEnrollment);

export const adminRoutes = router;
