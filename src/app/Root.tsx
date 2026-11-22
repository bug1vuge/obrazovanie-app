import { useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Toaster } from '@/shared/ui/native';
import { isOnboarded } from './onboarding';

/** Tab roots share one stack entry so switching tabs does not slide. */
const TAB_PATHS = new Set(['/', '/profile']);

/**
 * Stack navigation: a new screen slides in on push, the previous one slides
 * back on «Назад». Tab switches fade inside the tab layout instead.
 */
export function Root() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const key = TAB_PATHS.has(location.pathname) ? 'tabs' : location.pathname;

  // The animation is decided once per stack entry, so later re-renders of the
  // same screen never replay it.
  const entry = useRef<{ key: string | null; animation: string }>({ key: null, animation: '' });
  if (entry.current.key !== key) {
    entry.current = {
      key,
      animation:
        entry.current.key === null
          ? ''
          : navigationType === 'POP'
            ? 'screen-enter-pop'
            : 'screen-enter-push',
    };
  }

  if (!isOnboarded() && location.pathname === '/') return <Navigate to="/welcome" replace />;

  return (
    <>
      <div key={key} className={`absolute inset-0 ${entry.current.animation}`}>
        <Outlet />
      </div>
      <Toaster />
    </>
  );
}
