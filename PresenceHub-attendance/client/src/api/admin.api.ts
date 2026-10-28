// ============================================
// Admin API — HTTP Client Layer
// ============================================

import type { ApiResponse } from '@college-erp/shared';
import api, { unwrap } from './axios';
import type {
  AdminCourse,
  AdminDashboard,
  AdminDepartment,
  AdminEnrollment,
  AdminSection,
  AdminUser,
  CreateCourseInput,
  CreateUserInput,
} from '../types/api';

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get<ApiResponse<AdminDashboard>>('/admin/dashboard').then(unwrap),

  // Users
  listUsers: (params?: { role?: string; search?: string }) =>
    api.get<ApiResponse<AdminUser[]>>('/admin/users', { params }).then(unwrap),
  createUser: (data: CreateUserInput) => api.post('/admin/users', data),
  toggleUserStatus: (userId: string) =>
    api.patch(`/admin/users/${userId}/toggle-status`),

  // Departments
  listDepartments: () => api.get<ApiResponse<AdminDepartment[]>>('/admin/departments').then(unwrap),
  createDepartment: (data: { name: string; code: string }) =>
    api.post('/admin/departments', data),

  // Courses
  listCourses: () => api.get<ApiResponse<AdminCourse[]>>('/admin/courses').then(unwrap),
  createCourse: (data: CreateCourseInput) => api.post('/admin/courses', data),

  // Sections
  listSections: () => api.get<ApiResponse<AdminSection[]>>('/admin/sections').then(unwrap),

  // Enrollments
  listEnrollments: (sectionId?: string) =>
    api
      .get<ApiResponse<AdminEnrollment[]>>('/admin/enrollments', { params: sectionId ? { sectionId } : {} })
      .then(unwrap),
  enrollDepartmentStudents: (data: { sectionId: string; departmentId: string }) =>
    api
      .post<ApiResponse<{ enrolled: number; total: number }>>('/admin/enrollments/bulk', data)
      .then((res) => res.data),
  removeEnrollment: (studentId: string, sectionId: string) =>
    api.delete(`/admin/enrollments/${studentId}/${sectionId}`),
};
