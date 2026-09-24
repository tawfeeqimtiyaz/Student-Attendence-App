// ============================================
// Global Error Handler Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (
    err.name === 'PrismaClientInitializationError' ||
    (err as any).errorCode === 'P1001'
  ) {
    // Database connection failure — return 503 Service Unavailable
    statusCode = 503;
    message = 'Database is currently unavailable. Please try again later.';
  }

  // Log error in development
  if (env.NODE_ENV === 'development') {
    console.error(`\n❌ [${statusCode}] ${message}`);
    if (!(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && !(err instanceof AppError) && {
      stack: err.stack,
    }),
  });
}

