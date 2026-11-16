import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageLoader from '@/components/common/PageLoader';
import { loadSession, selectAuthStatus } from '@/features/auth/authSlice';

/**
 * Guards nested routes. Unauthenticated users go to /login and return to
 * the page they asked for after signing in.
 */
export default function RequireAuth() {
  const dispatch = useDispatch();
  const location = useLocation();
  const status = useSelector(selectAuthStatus);

  useEffect(() => {
    if (status === 'idle') dispatch(loadSession());
  }, [status, dispatch]);

  if (status === 'idle' || status === 'checking') {
    return <PageLoader label="Checking your session" />;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
