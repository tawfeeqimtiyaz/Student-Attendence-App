import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { ROUTES } from '../constants/routes';

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API call fails, clear the local session.
    }
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
    toast.success('Signed out');
  }, [logout, navigate]);
}
