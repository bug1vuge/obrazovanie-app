import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { CatalogScreen } from '@/screens/CatalogScreen';
import { CourseScreen } from '@/screens/CourseScreen';
import { LessonScreen } from '@/screens/LessonScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { NotFoundScreen } from '@/screens/NotFoundScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import { QuizScreen } from '@/screens/QuizScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { Root } from './Root';
import { TabsLayout } from './TabsLayout';

// Rarely used screens are split into separate chunks.
const EditorScreen = lazy(() =>
  import('@/screens/EditorScreen').then((module) => ({ default: module.EditorScreen })),
);
const AdminScreen = lazy(() =>
  import('@/screens/AdminScreen').then((module) => ({ default: module.AdminScreen })),
);
const CertificateScreen = lazy(() =>
  import('@/screens/CertificateScreen').then((module) => ({ default: module.CertificateScreen })),
);

const withSuspense = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      {
        element: <TabsLayout />,
        children: [
          { index: true, element: <CatalogScreen /> },
          { path: 'profile', element: <ProfileScreen /> },
        ],
      },
      { path: 'welcome', element: <WelcomeScreen /> },
      { path: 'login', element: <LoginScreen /> },
      { path: 'course/:id', element: <CourseScreen /> },
      { path: 'learn/:courseId/quiz/:quizId', element: <QuizScreen /> },
      { path: 'learn/:courseId/:lessonId?', element: <LessonScreen /> },
      { path: 'certificate/:courseId', element: withSuspense(<CertificateScreen />) },
      { path: 'studio/:id', element: withSuspense(<EditorScreen />) },
      { path: 'admin', element: withSuspense(<AdminScreen />) },
      { path: 'my', element: <Navigate to="/profile?tab=learning" replace /> },
      { path: 'studio', element: <Navigate to="/profile?tab=courses" replace /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
];
