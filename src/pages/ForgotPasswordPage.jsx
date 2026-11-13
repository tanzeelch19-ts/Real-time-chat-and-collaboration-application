import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import Button from '@/components/common/Button';
import FormAlert from '@/components/forms/FormAlert';
import FormField from '@/components/forms/FormField';
import { authApi } from '@/features/auth/authApi';
import { forgotPasswordSchema } from '@/features/auth/schemas';
import { toSerializableError } from '@/services/api/errors';
import { applyServerErrors } from '@/utils/formErrors';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      applyServerErrors(setError, toSerializableError(error));
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we will send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-300">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <FormAlert tone="success">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </FormAlert>
      ) : (
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sendingâ€¦' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}