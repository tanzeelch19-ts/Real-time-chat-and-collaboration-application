import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  logoutUser,
  registerUser,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionExpiredReason,
  updateProfile,
} from '@/features/auth/authSlice';

/**
 * Single entry point for auth state and actions. Each action resolves to the
 * dispatched action, so callers can check `action.error`.
 */
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionExpiredReason = useSelector(selectSessionExpiredReason);

  return {
    user,
    status,
    isAuthenticated,
    sessionExpiredReason,
    login: (credentials) => dispatch(loginUser(credentials)),
    register: (values) => dispatch(registerUser(values)),
    logout: () => dispatch(logoutUser()),
    updateProfile: (patch) => dispatch(updateProfile(patch)),
  };
}
