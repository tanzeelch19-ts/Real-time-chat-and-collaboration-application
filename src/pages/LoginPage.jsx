import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { loadSession, selectAuthStatus } from '@/features/auth/authSlice';
import { loginSchema } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { applyServerErrors } from '@/utils/formErrors';

export default function LoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const sessionStatus = useSelector(selectAuthStatus);
  const { isAuthenticated, login, sessionExpiredReason } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // If a valid session already exists, skip the form.
  useEffect(() => {
    if (sessionStatus === 'idle') dispatch(loadSession());
  }, [sessionStatus, dispatch]);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? '/workspaces'} replace />;
  }

  const onSubmit = async (values) => {
    const action = await login(values);
    if (action.error) applyServerErrors(setError, action.payload);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your workspaces."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      {import.meta.env.PROD && (
        <FormAlert tone="info" className="mb-4">
          This is the interface only. The login and chat backend is not connected on this site. Run the full app locally with npm run dev (see README).
        </FormAlert>
      )}

      {sessionExpiredReason === 'expired' && (
        <FormAlert tone="info" className="mb-4">
          Your session has expired. Please sign in again.
        </FormAlert>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}