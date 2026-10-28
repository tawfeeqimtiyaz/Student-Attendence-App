// ============================================
// App — Root Router with Role-Based Routing
// A data router (createBrowserRouter) so pages can block navigation
// while they hold unsaved changes.
// ============================================

import React, { lazy, useEffect } from 'react';
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route } from 'react-router-dom';
import { Role } from '@college-erp/shared';
import { useAuthStore } from './stores/auth.store';
import { authApi } from './api/auth.api';
import { refreshAccessToken } from './api/axios';

// Layouts & guards
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute, SessionSplash } from './components/shared/ProtectedRoute';
import { RoleGate, getDashboardRoute } from './components/shared/RoleGate';

// Eager: first screen for signed-out users
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/shared/NotFoundPage';

// Lazy: each page is its own chunk
const page = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const AdminDashboard = page(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const ManageUsers = page(() => import('./pages/admin/ManageUsers'), 'ManageUsers');
const ManageCourses = page(() => import('./pages/admin/ManageCourses'), 'ManageCourses');
const ManageDepartments = page(() => import('./pages/admin/ManageDepartments'), 'ManageDepartments');
const ManageEnrollments = page(() => import('./pages/admin/ManageEnrollments'), 'ManageEnrollments');
const SettingsPage = page(() => import('./pages/admin/SettingsPage'), 'SettingsPage');
const FacultyDashboard = page(() => import('./pages/faculty/FacultyDashboard'), 'FacultyDashboard');
const ManageSections = page(() => import('./pages/faculty/ManageSections'), 'ManageSections');
const FacultyAttendance = page(() => import('./pages/faculty/ManageAttendance'), 'ManageAttendance');
const FacultyMarks = page(() => import('./pages/faculty/ManageMarks'), 'ManageMarks');
const FacultyGrades = page(() => import('./pages/faculty/ManageGrades'), 'ManageGrades');
const FacultyResults = page(() => import('./pages/faculty/ManageResults'), 'ManageResults');
const FacultyDiscipline = page(() => import('./pages/faculty/ManageDiscipline'), 'ManageDiscipline');
const FacultyFines = page(() => import('./pages/faculty/ManageFines'), 'ManageFines');
const StudentDashboard = page(() => import('./pages/student/StudentDashboard'), 'StudentDashboard');
const MyAttendance = page(() => import('./pages/student/MyAttendance'), 'MyAttendance');
const MyMarks = page(() => import('./pages/student/MyMarks'), 'MyMarks');
const MyFees = page(() => import('./pages/student/MyFees'), 'MyFees');
const MyResults = page(() => import('./pages/student/MyResults'), 'MyResults');
const MyDiscipline = page(() => import('./pages/student/MyDiscipline'), 'MyDiscipline');
const StudentProfile = page(() => import('./pages/student/StudentProfile'), 'StudentProfile');
const NotificationsPage = page(() => import('./pages/shared/NotificationsPage'), 'NotificationsPage');

/** Restores the session from the refresh-token cookie once, on app start. */
const Root: React.FC = () => {
  const { isAuthenticated, setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
      return;
    }
    const restoreSession = async () => {
      try {
        // Stores the new access token before the profile request uses it.
        const accessToken = await refreshAccessToken();
        const profileRes = await authApi.getProfile();
        setAuth(profileRes.data, accessToken);
      } catch {
        // No valid session — stay signed out.
        setLoading(false);
      }
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Outlet />;
};

/** Signed-in users skip the login page. */
const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <SessionSplash />;
  if (isAuthenticated && user) return <Navigate to={getDashboardRoute(user.role as Role)} replace />;
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <SessionSplash />;
  return <Navigate to={isAuthenticated && user ? getDashboardRoute(user.role as Role) : '/login'} replace />;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Root />}>
      {/* ---- Public ---- */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/" element={<RootRedirect />} />

      {/* ---- Protected: Dashboard Layout ---- */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Routes */}
        <Route path="/admin" element={<RoleGate allowedRoles={[Role.ADMIN]}><Outlet /></RoleGate>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="enrollments" element={<ManageEnrollments />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Faculty Routes */}
        <Route path="/faculty" element={<RoleGate allowedRoles={[Role.FACULTY]}><Outlet /></RoleGate>}>
          <Route index element={<FacultyDashboard />} />
          <Route path="sections" element={<ManageSections />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="marks" element={<FacultyMarks />} />
          <Route path="grades" element={<FacultyGrades />} />
          <Route path="results" element={<FacultyResults />} />
          <Route path="discipline" element={<FacultyDiscipline />} />
          <Route path="fines" element={<FacultyFines />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<RoleGate allowedRoles={[Role.STUDENT]}><Outlet /></RoleGate>}>
          <Route index element={<StudentDashboard />} />
          <Route path="attendance" element={<MyAttendance />} />
          <Route path="marks" element={<MyMarks />} />
          <Route path="fees" element={<MyFees />} />
          <Route path="results" element={<MyResults />} />
          <Route path="discipline" element={<MyDiscipline />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Notifications come from the student dashboard feed */}
        <Route path="/notifications" element={<RoleGate allowedRoles={[Role.STUDENT]}><NotificationsPage /></RoleGate>} />

        {/* ---- Catch-All ---- */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  )
);
