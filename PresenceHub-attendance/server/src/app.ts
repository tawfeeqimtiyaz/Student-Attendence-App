// ============================================
// Express App Setup — Middleware Stack
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';

const app = express();

// ---- Security ----
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---- Parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- Rate Limiting (disabled in development) ----
// app.use('/api/', apiLimiter);

// ---- Health Check ----
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
    message: 'Server is running',
  });
});

import { studentRoutes } from './modules/student/student.routes.js';
import { facultyRoutes } from './modules/faculty/faculty.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

// ---- API Routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/admin', adminRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ---- Global Error Handler ----
app.use(errorMiddleware);

export default app;
