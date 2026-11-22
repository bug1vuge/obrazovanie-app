import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Whether there is an in-app history entry to return to. */
function canGoBack(locationKey: string): boolean {
  // Browser/hash routers keep the position in the history stack in `idx`.
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  if (typeof idx === 'number') return idx > 0;
  return locationKey !== 'default';
}

/**
 * «Назад» that never leaves the app: when the screen was opened directly
 * (no in-app history), it goes to `fallback` instead.
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (canGoBack(location.key)) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [location.key, navigate, fallback]);
}
