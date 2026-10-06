// ============================================
// Role-Based Access Control Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { Role } from '../shared/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Middleware factory that restricts access to specific roles.
 * Usage: router.get('/admin-only', authMiddleware, requireRole(Role.ADMIN), handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(
        AppError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}
