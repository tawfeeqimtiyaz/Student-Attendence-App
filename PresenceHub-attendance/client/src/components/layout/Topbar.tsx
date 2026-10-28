// ============================================
// Topbar — breadcrumbs, theme, notifications (students), account menu
// ============================================

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, LogOut, Menu as MenuIcon, Moon, Settings, Sun, UserCircle } from 'lucide-react';
import { Role } from '@college-erp/shared';
import { useUI } from '../../contexts/UIContext';
import { useAuthStore } from '../../stores/auth.store';
import { findNavEntry, PORTAL_LABELS, ROLE_LABELS } from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { getDashboardRoute } from '../shared/RoleGate';
import { useLogout } from '../../hooks/useLogout';
import { fullName } from '../../utils/format';
import { IconButton } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '../ui/Menu';

function Breadcrumbs({ role }: { role: Role }) {
  const { pathname } = useLocation();
  const entry = findNavEntry(role, pathname);
  const home = getDashboardRoute(role);
  const isHome = entry?.item.path === home;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <li className="hidden shrink-0 sm:block">
          {isHome ? (
            <span className="text-fg-subtle">{PORTAL_LABELS[role]}</span>
          ) : (
            <Link to={home} className="rounded text-fg-subtle transition-colors hover:text-fg">
              {PORTAL_LABELS[role]}
            </Link>
          )}
        </li>
        {entry && (
          <>
            <li aria-hidden className="hidden text-fg-subtle/60 sm:block">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="min-w-0">
              <span aria-current="page" className="block truncate font-medium text-fg">
                {entry.item.label}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

export const Topbar: React.FC = () => {
  const { openSidebar, theme, toggleTheme } = useUI();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logout = useLogout();

  if (!user) return null;
  const role = user.role as Role;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
      <div className="mx-auto flex h-header w-full max-w-content items-center gap-3 px-4 sm:px-6 lg:px-8">
        <IconButton label="Open navigation" icon={<MenuIcon />} className="-ml-2 lg:hidden" onClick={openSidebar} />

        <div className="min-w-0 flex-1">
          <Breadcrumbs role={role} />
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            icon={theme === 'dark' ? <Sun /> : <Moon />}
            onClick={toggleTheme}
          />

          {role === Role.STUDENT && (
            <IconButton label="Notifications" icon={<Bell />} onClick={() => navigate(ROUTES.NOTIFICATIONS)} />
          )}

          <div aria-hidden className="mx-1.5 hidden h-6 w-px bg-line sm:block" />

          <Menu
            trigger={(props) => (
              <button
                {...props}
                aria-label={`Account menu for ${fullName(user)}`}
                className="flex h-9 items-center gap-2 rounded-md pl-1 pr-1.5 transition-colors hover:bg-subtle aria-expanded:bg-subtle"
              >
                <Avatar person={user} size="sm" />
                <span className="hidden max-w-36 truncate text-sm font-medium text-fg md:block">{fullName(user)}</span>
                <ChevronDown className="hidden size-4 text-fg-subtle md:block" aria-hidden />
              </button>
            )}
          >
            <MenuLabel>
              <p className="truncate text-sm font-semibold text-fg">{fullName(user)}</p>
              <p className="truncate text-xs text-fg-subtle">{user.email}</p>
              <Badge tone="brand" className="mt-2">
                {ROLE_LABELS[role]}
              </Badge>
            </MenuLabel>
            <MenuSeparator />
            {role === Role.STUDENT && (
              <MenuItem icon={UserCircle} onClick={() => navigate(ROUTES.STUDENT_PROFILE)}>
                My profile
              </MenuItem>
            )}
            {role === Role.ADMIN && (
              <MenuItem icon={Settings} onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}>
                Settings
              </MenuItem>
            )}
            <MenuItem icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme}>
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={LogOut} tone="danger" onClick={logout}>
              Sign out
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
};
