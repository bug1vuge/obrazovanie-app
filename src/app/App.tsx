import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DeviceFrame } from '@/device/DeviceFrame';
import { SplashScreen } from '@/screens/SplashScreen';
import { ErrorBoundary } from './ErrorBoundary';
import { routes } from './routes';

/** Hash routing keeps deep links working on static hosting (GitHub Pages). */
const router = createHashRouter(routes);

export function App() {
  return (
    <ErrorBoundary>
      <DeviceFrame>
        <RouterProvider router={router} />
        <SplashScreen />
      </DeviceFrame>
    </ErrorBoundary>
  );
}
