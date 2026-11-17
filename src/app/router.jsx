import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import RequireAuth from '@/features/auth/RequireAuth';

// Pages load on demand, so the first screen does not download the whole app.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const WorkspaceSelectorPage = lazy(() => import('@/pages/WorkspaceSelectorPage'));
const InvitationPage = lazy(() => import('@/pages/InvitationPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PreferencesPage = lazy(() => import('@/pages/PreferencesPage'));
const ChannelPage = lazy(() => import('@/pages/ChannelPage'));
const DirectMessagePage = lazy(() => import('@/pages/DirectMessagePage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const SavedPage = lazy(() => import('@/pages/SavedPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const WorkspaceSettingsPage = lazy(() => import('@/pages/WorkspaceSettingsPage'));
const WorkspaceHomePage = lazy(() => import('@/pages/WorkspaceHomePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * Public routes are open. Everything under RequireAuth needs a valid session.
 */
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/workspaces" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/workspaces', element: <WorkspaceSelectorPage /> },
      { path: '/invite/:token', element: <InvitationPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/preferences', element: <PreferencesPage /> },
      {
        path: '/w/:workspaceId',
        element: <AppShell />,
        children: [
          { index: true, element: <WorkspaceHomePage /> },
          { path: 'channels/:channelId', element: <ChannelPage /> },
          { path: 'dm/:conversationId', element: <DirectMessagePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'saved', element: <SavedPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'settings', element: <WorkspaceSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
