import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { Role } from '../../shared/index.js';
import * as StudentController from './student.controller.js';

const router = Router();

// All routes require authentication and STUDENT role
router.use(authMiddleware);
router.use(requireRole(Role.STUDENT));

router.get('/dashboard', StudentController.getDashboard);
router.get('/attendance', StudentController.getAttendance);
router.get('/marks', StudentController.getMarks);
router.get('/fees', StudentController.getFees);
router.get('/results', StudentController.getResults);
router.get('/discipline', StudentController.getDiscipline);

export const studentRoutes = router;
