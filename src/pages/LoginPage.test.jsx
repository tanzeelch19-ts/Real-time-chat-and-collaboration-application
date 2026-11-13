import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/pages/LoginPage';
import { authApi } from '@/features/auth/authApi';
import { ApiClientError } from '@/services/api/errors';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/auth/authApi', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), fetchCurrentUser: vi.fn() },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('shows client-side validation and does not call the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows the server error when the credentials are wrong', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue(
      new ApiClientError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }),
    );
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'owner@demo.test');
    await user.type(screen.getByLabelText('Password'), 'wrong-pass1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });
});