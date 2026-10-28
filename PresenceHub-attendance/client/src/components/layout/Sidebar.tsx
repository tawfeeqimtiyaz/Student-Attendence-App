// ============================================
// Sidebar — fixed, collapsible on desktop; a modal drawer below lg
// ============================================

import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Role } from '@college-erp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { getNavigationForRole, PORTAL_LABELS, ROLE_LABELS, type NavItem } from '../../constants/navigation';
import { useUI } from '../../contexts/UIContext';
import { cn } from '../../utils/cn';
import { fullName } from '../../utils/format';
import { BrandLockup } from './BrandMark';
import { Tooltip } from '../ui/Tooltip';
import { Dialog } from '../ui/Dialog';
import { IconButton } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Tooltip content={item.label} disabled={!collapsed}>
      <NavLink
        to={item.path}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'group relative flex h-9 items-center rounded-md text-sm font-medium transition-colors',
            collapsed ? 'w-11 justify-center' : 'gap-3 px-2.5',
            isActive
              ? 'bg-brand-soft text-brand-text'
              : 'text-fg-muted hover:bg-subtle hover:text-fg'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={cn(
                'size-[18px] shrink-0 transition-colors',
                isActive ? 'text-brand-text' : 'text-fg-subtle group-hover:text-fg-muted'
              )}
            />
            <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
          </>
        )}
      </NavLink>
    </Tooltip>
  );
}

function SidebarNav({ role, collapsed, onNavigate }: { role: Role; collapsed: boolean; onNavigate?: () => void }) {
  const sections = getNavigationForRole(role);
  return (
    <nav aria-label="Main" className={cn('flex-1 overflow-y-auto overflow-x-hidden py-4', collapsed ? 'px-3' : 'px-3')}>
      <ul className="space-y-5">
        {sections.map((section, index) => (
          <li key={section.title}>
            {collapsed ? (
              index > 0 && <div aria-hidden className="mx-2 mb-3 h-px bg-line" />
            ) : (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.path}>
                  <SidebarLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const Sidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { isSidebarOpen, closeSidebar, isSidebarCollapsed, toggleCollapse } = useUI();

  // Close the mobile drawer after navigation.
  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!user) return null;
  const role = user.role as Role;
  const collapsed = isSidebarCollapsed;

  return (
    <>
      {/* ---- Desktop ---- */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-card transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
        )}
      >
        <div className={cn('flex h-header shrink-0 items-center border-b border-line', collapsed ? 'justify-center' : 'pl-[15px] pr-3')}>
          <BrandLockup subtitle={PORTAL_LABELS[role]} collapsed={collapsed} />
        </div>

        <SidebarNav role={role} collapsed={collapsed} />

        <div className="shrink-0 border-t border-line p-3">
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} disabled={!collapsed}>
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={cn(
                'flex h-9 items-center rounded-md text-sm font-medium text-fg-muted transition-colors hover:bg-subtle hover:text-fg',
                collapsed ? 'w-11 justify-center' : 'w-full gap-3 px-2.5'
              )}
            >
              {collapsed ? <PanelLeftOpen className="size-[18px] text-fg-subtle" /> : <PanelLeftClose className="size-[18px] text-fg-subtle" />}
              {!collapsed && <span>Collapse</span>}
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* ---- Mobile drawer ---- */}
      <Dialog open={isSidebarOpen} onClose={closeSidebar} title="Navigation" variant="drawer-left" bare className="lg:hidden">
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line pl-[15px] pr-3">
          <BrandLockup subtitle={PORTAL_LABELS[role]} />
          <IconButton label="Close navigation" icon={<X />} size="sm" onClick={closeSidebar} />
        </div>
        <SidebarNav role={role} collapsed={false} onNavigate={closeSidebar} />
        <div className="flex shrink-0 items-center gap-3 border-t border-line px-[15px] py-3">
          <Avatar person={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{fullName(user)}</p>
            <p className="truncate text-xs text-fg-subtle">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </Dialog>
    </>
  );
};
