import { lazyWithReload } from '@/app/lazyRoute';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import RequireAuth from '@/features/auth/RequireAuth';

// Pages load on demand, so the first screen does not download the whole app.
const LoginPage = lazyWithReload(() => import('@/pages/LoginPage'));
const RegisterPage = lazyWithReload(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazyWithReload(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithReload(() => import('@/pages/ResetPasswordPage'));
const WorkspaceSelectorPage = lazyWithReload(() => import('@/pages/WorkspaceSelectorPage'));
const InvitationPage = lazyWithReload(() => import('@/pages/InvitationPage'));
const ProfilePage = lazyWithReload(() => import('@/pages/ProfilePage'));
const PreferencesPage = lazyWithReload(() => import('@/pages/PreferencesPage'));
const ChannelPage = lazyWithReload(() => import('@/pages/ChannelPage'));
const DirectMessagePage = lazyWithReload(() => import('@/pages/DirectMessagePage'));
const SearchPage = lazyWithReload(() => import('@/pages/SearchPage'));
const SavedPage = lazyWithReload(() => import('@/pages/SavedPage'));
const NotificationsPage = lazyWithReload(() => import('@/pages/NotificationsPage'));
const WorkspaceSettingsPage = lazyWithReload(() => import('@/pages/WorkspaceSettingsPage'));
const WorkspaceHomePage = lazyWithReload(() => import('@/pages/WorkspaceHomePage'));
const NotFoundPage = lazyWithReload(() => import('@/pages/NotFoundPage'));

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
