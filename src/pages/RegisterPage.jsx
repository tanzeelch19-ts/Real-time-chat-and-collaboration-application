import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { registerSchema } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { applyServerErrors } from '@/utils/formErrors';

export default function RegisterPage() {
  const { isAuthenticated, register: registerAccount } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  if (isAuthenticated) return <Navigate to="/workspaces" replace />;

  const onSubmit = async (values) => {
    const action = await registerAccount(values);
    if (action.error) applyServerErrors(setError, action.payload);
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join your team's workspace in a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
            Sign in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <FormAlert>{errors.root.message}</FormAlert>}

        <FormField
          id="displayName"
          label="Display name"
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
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
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating accountâ€¦' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
