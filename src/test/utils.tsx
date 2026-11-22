import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { markOnboarded } from '@/app/onboarding';
import { buildSeed } from '@/data/seed';
import { DeviceFrame } from '@/device/DeviceFrame';
import { useDeviceStore, type Platform } from '@/device/deviceStore';
import { useToasts } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';

/** Fixed clock for deterministic demo data in tests. */
export const TEST_NOW = new Date('2026-11-20T12:00:00.000Z');

export function resetStore(userId: string | null = null) {
  useAppStore.setState({ db: buildSeed(TEST_NOW), session: { userId } });
  useToasts.setState({ toasts: [] });
}

interface RenderOptions {
  userId?: string | null;
  onboarded?: boolean;
  platform?: Platform;
}

export function renderApp(
  path = '/',
  { userId = null, onboarded = true, platform = 'ios' }: RenderOptions = {},
) {
  resetStore(userId);
  if (onboarded) markOnboarded();
  useDeviceStore.setState({ platform });
  const user = userEvent.setup();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <DeviceFrame>
      <RouterProvider router={router} />
    </DeviceFrame>,
  );
  return { user, router, ...utils };
}
