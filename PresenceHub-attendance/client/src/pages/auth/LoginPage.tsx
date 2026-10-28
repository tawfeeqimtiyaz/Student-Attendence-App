// ============================================
// Login Page — sign in, demo accounts, password reset
// ============================================

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle2, ClipboardCheck, Eye, EyeOff, FileText, ShieldCheck, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@college-erp/shared';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../api/auth.api';
import { SESSION_EXPIRED_KEY } from '../../api/axios';
import { getDashboardRoute } from '../../components/shared/RoleGate';
import { BrandLockup } from '../../components/layout/BrandMark';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/Form';
import { Alert } from '../../components/ui/States';
import { Dialog } from '../../components/ui/Dialog';
import { getErrorMessage } from '../../utils/errors';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@college.edu' },
  { role: 'Faculty', email: 'rajesh.sharma@college.edu' },
  { role: 'Student', email: 'aarav.sharma@student.college.edu' },
];
const DEMO_PASSWORD = 'college123';

const FEATURES = [
  { icon: ClipboardCheck, title: 'Attendance', text: 'Mark, review and correct daily attendance per section.' },
  { icon: FileText, title: 'Marks & grades', text: 'Record exam marks, final grades and semester results.' },
  { icon: Wallet, title: 'Fees & records', text: 'Students see dues, discipline records and their profile.' },
];

interface LoginValues {
  email: string;
  password: string;
}

function consumeSessionExpired(): boolean {
  try {
    const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    return expired;
  } catch {
    return false;
  }
}

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired] = useState(consumeSessionExpired);
  const [showReset, setShowReset] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from?.pathname;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });

  useEffect(() => {
    document.title = 'Sign in · PresenceHub';
  }, []);

  const onSubmit = async (values: LoginValues) => {
    setError('');
    try {
      const response = await authApi.login(values);
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.firstName}`);
      const home = getDashboardRoute(user.role as Role);
      // Return to the page that required sign-in, if it belongs to this role's area.
      const target = from && from.startsWith(home) ? from : home;
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed. Please try again.'));
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    setError('');
  };

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* ---- Brand panel ---- */}
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden border-r border-line bg-card p-12 lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_0%_0%,var(--color-brand-soft),transparent)]" />
        <div className="relative">
          <BrandLockup subtitle="Attendance & academics" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-fg">
            Every class, every student, accounted for.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
            PresenceHub brings attendance, assessment and student records together for administrators, faculty and students.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-brand-text">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{title}</p>
                  <p className="mt-0.5 text-[13px] text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-fg-subtle">
          <ShieldCheck className="size-4" aria-hidden /> Access is limited to accounts issued by your institution.
        </p>
      </aside>

      {/* ---- Form ---- */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <BrandLockup subtitle="Attendance & academics" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in</h1>
          <p className="mt-1.5 text-sm text-fg-muted">Use your email, employee ID or roll number.</p>

          {sessionExpired && (
            <Alert tone="warning" className="mt-6" title="Your session has expired">
              Please sign in again to continue.
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <FormField label="Email, employee ID or roll number" error={errors.email?.message} required>
              <Input
                id="email"
                autoComplete="username"
                autoFocus
                placeholder="name@college.edu"
                className="h-10"
                {...register('email', { required: 'Enter your email, employee ID or roll number' })}
              />
            </FormField>

            <FormField
              label="Password"
              error={errors.password?.message}
              required
              labelAside={
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="rounded text-[13px] font-medium text-brand-text hover:underline"
                >
                  Forgot password?
                </button>
              }
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="h-10 pr-10"
                  {...register('password', {
                    required: 'Enter your password',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:bg-subtle hover:text-fg"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-dashed border-line-strong p-4">
            <p className="text-[13px] font-medium text-fg">Demo accounts</p>
            <p className="mt-0.5 text-xs text-fg-subtle">
              Fill the form with a seeded account (password <span className="font-mono">{DEMO_PASSWORD}</span>).
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <Button key={acct.role} variant="secondary" size="sm" onClick={() => fillDemo(acct.email)}>
                  {acct.role}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ResetPasswordDialog open={showReset} onClose={() => setShowReset(false)} />
    </div>
  );
};

interface ResetValues {
  identifier: string;
  newPassword: string;
  confirmPassword: string;
}

function ResetPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ defaultValues: { identifier: '', newPassword: '', confirmPassword: '' } });

  const close = () => {
    onClose();
    reset();
    setDone(false);
    setError('');
  };

  const onSubmit = async ({ identifier, newPassword }: ResetValues) => {
    setError('');
    try {
      await authApi.resetPassword({ identifier, newPassword });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset the password.'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={done ? 'Password updated' : 'Reset password'}
      description={done ? undefined : 'Set a new password for your account.'}
      dismissible={!isSubmitting}
      footer={
        done ? (
          <Button onClick={close}>Back to sign in</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="reset-password-form" loading={isSubmitting}>
              Reset password
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex items-start gap-3 text-sm text-fg-muted">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
          <p>Your password has been changed. You can now sign in with the new password.</p>
        </div>
      ) : (
        <form id="reset-password-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Email, employee ID or roll number" error={errors.identifier?.message} required>
            <Input autoComplete="username" {...register('identifier', { required: 'Enter your account identifier' })} />
          </FormField>
          <FormField label="New password" hint="At least 6 characters." error={errors.newPassword?.message} required>
            <Input
              type="password"
              autoComplete="new-password"
              {...register('newPassword', {
                required: 'Enter a new password',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
          </FormField>
          <FormField label="Confirm new password" error={errors.confirmPassword?.message} required>
            <Input
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Re-enter the new password',
                validate: (value) => value === getValues('newPassword') || 'Passwords do not match',
              })}
            />
          </FormField>
          {error && <Alert tone="danger">{error}</Alert>}
        </form>
      )}
    </Dialog>
  );
}
