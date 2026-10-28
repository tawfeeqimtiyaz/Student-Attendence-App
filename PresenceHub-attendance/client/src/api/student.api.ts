import type { ApiResponse } from '@college-erp/shared';
import api, { unwrap } from './axios';
import type {
  StudentAttendanceRecord,
  StudentDashboard,
  StudentDiscipline,
  StudentFee,
  StudentMark,
  StudentResult,
} from '../types/api';

export const studentApi = {
  getDashboard: () => api.get<ApiResponse<StudentDashboard>>('/students/dashboard').then(unwrap),
  getAttendance: () => api.get<ApiResponse<StudentAttendanceRecord[]>>('/students/attendance').then(unwrap),
  getMarks: () => api.get<ApiResponse<StudentMark[]>>('/students/marks').then(unwrap),
  getFees: () => api.get<ApiResponse<StudentFee[]>>('/students/fees').then(unwrap),
  getResults: () => api.get<ApiResponse<StudentResult[]>>('/students/results').then(unwrap),
  getDiscipline: () => api.get<ApiResponse<StudentDiscipline[]>>('/students/discipline').then(unwrap),
};
