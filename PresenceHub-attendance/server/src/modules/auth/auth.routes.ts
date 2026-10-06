// ============================================
// Auth Routes
// ============================================

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../../shared/index.js';
import { authLimiter } from '../../middleware/rateLimiter.middleware.js';
import { Role } from '../../shared/index.js';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res) =>
  authController.logout(req, res)
);

router.post('/reset-password', (req, res, next) =>
  authController.resetPassword(req, res, next)
);

// Protected routes
router.get('/me', authMiddleware, (req, res, next) =>
  authController.getProfile(req, res, next)
);

// Admin-only: register new users
router.post(
  '/register',
  authMiddleware,
  requireRole(Role.ADMIN),
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

export { router as authRoutes };
