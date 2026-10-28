// ============================================
// Auth API Functions
// ============================================

import api from './axios';
import type { LoginRequest, UserProfile, ApiResponse } from '@college-erp/shared';
import type { ProfileDetails } from '../types/api';

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await api.post<ApiResponse<{ accessToken: string; user: UserProfile }>>('/auth/login', data);
    return res.data;
  },

  refresh: async () => {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get<ApiResponse<ProfileDetails>>('/auth/me');
    return res.data;
  },

  resetPassword: async (data: { identifier: string; newPassword: string }) => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return res.data;
  },
};
