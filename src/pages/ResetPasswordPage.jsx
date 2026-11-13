import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { authApi } from '@/features/auth/authApi';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { toSerializableError } from '@/services/api/errors';
import { applyServerErrors } from '@/utils/formErrors';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const footer = (
    <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
      Back to sign in
    </Link>
  );

  if (!token) {
    return (
      <AuthLayout title="Link not valid" footer={footer}>
        <FormAlert>This reset link is missing its token. Request a new one from the sign-in page.</FormAlert>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password }) => {
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (error) {
      applyServerErrors(setError, toSerializableError(error));
    }
  };

  return (
    <AuthLayout title="Choose a new password" footer={footer}>
      {done ? (
        <FormAlert tone="success">Your password has been updated. You can sign in with it now.</FormAlert>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && <FormAlert>{errors.root.message}</FormAlert>}
          <FormField
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            error={errors.password?.message}
            {...register('password')}
          />
          <FormField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updatingâ€¦' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}