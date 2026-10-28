// ============================================
// Warn before leaving a page with unsaved edits —
// in-app navigation (router blocker) and tab close / reload (beforeunload).
// ============================================

import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return {
    isBlocked: blocker.state === 'blocked',
    proceed: () => blocker.proceed?.(),
    cancel: () => blocker.reset?.(),
  };
}
