import React from 'react';
import axios from 'axios';
import { Activity, LogOut, Monitor, Moon, Palette, Sun, UserCircle } from 'lucide-react';
import type { ApiResponse } from '@college-erp/shared';
import { Role } from '@college-erp/shared';
import { useUI } from '../../contexts/UIContext';
import { useAuthStore } from '../../stores/auth.store';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useLogout } from '../../hooks/useLogout';
import { ROLE_LABELS } from '../../constants/navigation';
import { formatTimestamp, fullName } from '../../utils/format';
import type { ThemePreference } from '../../utils/theme';
import { cn } from '../../utils/cn';
import { version } from '../../../package.json';
import { Page, PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/States';

const THEMES: { value: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

interface Health {
  status: string;
  timestamp: string;
  environment: string;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
      <dt className="text-[13px] text-fg-muted">{label}</dt>
      <dd className="text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const { themePreference, setThemePreference } = useUI();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const health = useApiQuery(() => axios.get<ApiResponse<Health>>('/api/health').then((r) => r.data.data), []);

  return (
    <Page>
      <PageHeader title="Settings" description="Personal preferences and system status." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Palette} title="Appearance" description="Saved on this device." />
          <fieldset className="mt-5">
            <legend className="mb-2 text-[13px] font-medium text-fg">Theme</legend>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const selected = themePreference === value;
                return (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
                      selected ? 'border-brand bg-brand-soft text-brand-text' : 'border-line text-fg-muted hover:bg-subtle hover:text-fg'
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={value}
                      checked={selected}
                      onChange={() => setThemePreference(value)}
                      className="sr-only"
                    />
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-subtle">“System” follows your operating system’s light or dark setting.</p>
          </fieldset>
        </Card>

        <Card>
          <CardHeader icon={UserCircle} title="Your account" />
          {user && (
            <>
              <div className="mt-5 flex items-center gap-3">
                <Avatar person={user} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">{fullName(user)}</p>
                  <p className="truncate text-[13px] text-fg-muted">{user.email}</p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-line border-t border-line">
                <Row label="Role">
                  <Badge tone="brand">{ROLE_LABELS[user.role as Role]}</Badge>
                </Row>
                <Row label="Member since">{formatTimestamp(user.createdAt)}</Row>
              </dl>
              <Button variant="secondary" className="mt-4" leftIcon={<LogOut />} onClick={logout}>
                Sign out
              </Button>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            icon={Activity}
            title="System status"
            description="Live response from the API health check."
            actions={
              <Button variant="secondary" size="sm" onClick={health.reload} loading={health.isLoading}>
                Check again
              </Button>
            }
          />
          <dl className="mt-4 grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
            <Row label="API">
              {health.isLoading && !health.data ? (
                <Skeleton className="h-5 w-24" />
              ) : health.error ? (
                <Badge tone="danger">Unreachable</Badge>
              ) : (
                <Badge tone="success">Operational</Badge>
              )}
            </Row>
            <Row label="Environment">{health.data?.environment ?? '—'}</Row>
            <Row label="Last checked">{health.data ? formatTimestamp(health.data.timestamp, 'd MMM yyyy, HH:mm:ss') : '—'}</Row>
            <Row label="Client version">v{version}</Row>
          </dl>
        </Card>
      </div>
    </Page>
  );
};
