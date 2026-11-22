import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/store/hooks';

/** Returns a guard: `true` when signed in, otherwise opens the sign-in screen. */
export function useRequireAuth() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (user) return true;
    navigate(`/login?from=${encodeURIComponent(location.pathname + location.search)}`);
    return false;
  }, [user, navigate, location.pathname, location.search]);
}
