import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * «Назад» that never leaves the app: when the page was opened directly
 * (no in-app history), it goes to `fallback` instead.
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (location.key === 'default') navigate(fallback, { replace: true });
    else navigate(-1);
  }, [location.key, navigate, fallback]);
}
