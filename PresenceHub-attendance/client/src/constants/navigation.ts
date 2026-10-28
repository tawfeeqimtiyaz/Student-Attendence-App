// ============================================
// Navigation Configuration — Per-Role Sidebar Items
// Also the source of page titles and breadcrumbs.
// ============================================

import type { ComponentType } from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Award,
  Settings,
  ShieldAlert,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
  Receipt,
} from 'lucide-react';
import { Role } from '@college-erp/shared';
import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  /** Match the path exactly (dashboards are prefixes of every route in their area). */
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Administrator',
  [Role.FACULTY]: 'Faculty',
  [Role.STUDENT]: 'Student',
};

export const PORTAL_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Admin console',
  [Role.FACULTY]: 'Faculty portal',
  [Role.STUDENT]: 'Student portal',
};

const NAVIGATION: Record<Role, NavSection[]> = {
  [Role.ADMIN]: [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, end: true }],
    },
    {
      title: 'People',
      items: [{ label: 'Users', path: ROUTES.ADMIN_USERS, icon: Users }],
    },
    {
      title: 'Academics',
      items: [
        { label: 'Departments', path: ROUTES.ADMIN_DEPARTMENTS, icon: Building2 },
        { label: 'Courses', path: ROUTES.ADMIN_COURSES, icon: BookOpen },
        { label: 'Enrollments', path: ROUTES.ADMIN_ENROLLMENTS, icon: UserPlus },
      ],
    },
    {
      title: 'System',
      items: [{ label: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: Settings }],
    },
  ],

  [Role.FACULTY]: [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', path: ROUTES.FACULTY_DASHBOARD, icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Teaching',
      items: [
        { label: 'My sections', path: ROUTES.FACULTY_SECTIONS, icon: Library },
        { label: 'Attendance', path: ROUTES.FACULTY_ATTENDANCE, icon: ClipboardCheck },
      ],
    },
    {
      title: 'Assessment',
      items: [
        { label: 'Marks', path: ROUTES.FACULTY_MARKS, icon: FileText },
        { label: 'Grades', path: ROUTES.FACULTY_GRADES, icon: Award },
        { label: 'Results', path: ROUTES.FACULTY_RESULTS, icon: GraduationCap },
      ],
    },
    {
      title: 'Student affairs',
      items: [
        { label: 'Discipline', path: ROUTES.FACULTY_DISCIPLINE, icon: ShieldAlert },
        { label: 'Fines', path: ROUTES.FACULTY_FINES, icon: Receipt },
      ],
    },
  ],

  [Role.STUDENT]: [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard, end: true },
        { label: 'Notifications', path: ROUTES.NOTIFICATIONS, icon: Bell },
      ],
    },
    {
      title: 'Academics',
      items: [
        { label: 'Attendance', path: ROUTES.STUDENT_ATTENDANCE, icon: ClipboardCheck },
        { label: 'Marks', path: ROUTES.STUDENT_MARKS, icon: FileText },
        { label: 'Results', path: ROUTES.STUDENT_RESULTS, icon: GraduationCap },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Fees', path: ROUTES.STUDENT_FEES, icon: Wallet },
        { label: 'Discipline', path: ROUTES.STUDENT_DISCIPLINE, icon: ShieldAlert },
        { label: 'Profile', path: ROUTES.STUDENT_PROFILE, icon: UserCircle },
      ],
    },
  ],
};

export function getNavigationForRole(role: Role): NavSection[] {
  return NAVIGATION[role] ?? [];
}

/** Find the nav entry (and its section) for a pathname, for titles and breadcrumbs. */
export function findNavEntry(role: Role, pathname: string): { section: NavSection; item: NavItem } | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  for (const section of getNavigationForRole(role)) {
    for (const item of section.items) {
      if (item.path === normalized) return { section, item };
    }
  }
  return null;
}
