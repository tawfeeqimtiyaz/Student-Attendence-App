// ============================================
// Auth Service — Business Logic
// ============================================

import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../../utils/jwt.js';
import { AppError } from '../../utils/AppError.js';
import { Role } from '../../shared/index.js';

export class AuthService {
  /**
   * Authenticate user with email/password, return tokens + user profile
   */
  async login(identifier: string, password: string) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { faculty: { employeeId: identifier } },
          { student: { rollNumber: identifier } }
        ]
      }
    });

    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account has been deactivated. Contact admin.');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const tokens = generateTokenPair(tokenPayload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw AppError.unauthorized('User not found or deactivated');
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as Role,
      };

      const tokens = generateTokenPair(tokenPayload);

      return tokens;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  /**
   * Register a new user (admin-only in production, open for seeding)
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw AppError.conflict('A user with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Get current authenticated user's profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        student: {
          include: { department: true },
        },
        faculty: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return user;
  }

  /**
   * Reset password by email/employeeId/rollNumber
   */
  async resetPassword(identifier: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { faculty: { employeeId: identifier } },
          { student: { rollNumber: identifier } },
        ],
      },
    });

    if (!user) {
      throw AppError.notFound('No account found with that identifier');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }
}

export const authService = new AuthService();
