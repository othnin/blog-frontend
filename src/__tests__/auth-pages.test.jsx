/**
 * Tests for FE-001 to FE-005: Auth pages
 * Covers: LoginPage, RegisterForm, ForgotPasswordForm, ResetPasswordForm, VerifyEmailForm
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import RegisterForm from '@/components/RegisterForm';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import VerifyEmailForm from '@/components/VerifyEmailForm';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

const mockLoginFn = jest.fn();
jest.mock('@/components/authProvider', () => ({
  useAuth: () => ({
    login: mockLoginFn,
    isAuthenticated: false,
    loading: false,
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: async () => data });
const fail = (data, status = 400) =>
  Promise.resolve({ ok: false, status, json: async () => data });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  useRouter.mockReturnValue({ push: mockPush, replace: mockReplace });
  useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) });
  usePathname.mockReturnValue('/');
});

// ─── LoginPage (FE-001) ────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('renders heading, fields, and nav links', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your password/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('calls auth.login with username on successful submit', async () => {
    global.fetch.mockResolvedValueOnce(ok({ loggedIn: true, username: 'testuser' }));
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText(/username or email/i), 'testuser');
    await user.type(screen.getByPlaceholderText(/your password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^login$/i }));
    await waitFor(() => expect(mockLoginFn).toHaveBeenCalledWith('testuser'));
  });

  it('shows detail error on failed login', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'Invalid credentials' }, 401));
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText(/username or email/i), 'testuser');
    await user.type(screen.getByPlaceholderText(/your password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /^login$/i }));
    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    );
  });

  it('shows generic error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText(/username or email/i), 'testuser');
    await user.type(screen.getByPlaceholderText(/your password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^login$/i }));
    await waitFor(() =>
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
    );
  });

  it('disables button and shows loading text during submission', async () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByPlaceholderText(/username or email/i), 'testuser');
    await user.type(screen.getByPlaceholderText(/your password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^login$/i }));
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });
});

// ─── RegisterForm (FE-002) ────────────────────────────────────────────────────

describe('RegisterForm', () => {
  it('renders all registration fields', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/choose your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('redirects to verify-email with email param on success', async () => {
    global.fetch.mockResolvedValueOnce(ok({ message: 'Registered' }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByPlaceholderText(/choose your username/i), 'newuser');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'new@example.com');
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'Password1');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        '/verify-email?email=new%40example.com'
      )
    );
  });

  it('shows detail error from API response', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'Email already registered' }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByPlaceholderText(/choose your username/i), 'newuser');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'taken@example.com');
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'Password1');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    );
  });

  it('formats Pydantic validation error array', async () => {
    global.fetch.mockResolvedValueOnce(
      fail([{ loc: ['body', 'password'], msg: 'too short' }])
    );
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByPlaceholderText(/choose your username/i), 'newuser');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'short');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() =>
      expect(screen.getByText(/password: too short/i)).toBeInTheDocument()
    );
  });

  it('formats Django Ninja 422 validation errors nested under detail key', async () => {
    // Django Ninja returns { detail: [{type, loc, msg, ctx}, ...] } on 422
    global.fetch.mockResolvedValueOnce(
      fail(
        {
          detail: [
            { type: 'string_too_short', loc: ['body', 'password'], msg: 'String should have at least 8 characters', ctx: { min_length: 8 } },
            { type: 'value_error', loc: ['body', 'email'], msg: 'value is not a valid email address', ctx: {} },
          ],
        },
        422
      )
    );
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.type(screen.getByPlaceholderText(/choose your username/i), 'newuser');
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'short');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      const errorEl = screen.getByText(/string should have at least 8 characters/i);
      expect(errorEl).toBeInTheDocument();
      // Both field errors should be joined in the same element
      expect(errorEl.textContent).toMatch(/email/i);
    });
  });
});

// ─── ForgotPasswordForm (FE-004) ──────────────────────────────────────────────

describe('ForgotPasswordForm', () => {
  it('renders email input and submit button', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@example\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('shows "Check Your Email" success view after submission', async () => {
    global.fetch.mockResolvedValueOnce(ok({ message: 'Email sent' }));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByPlaceholderText(/your@example\.com/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    );
  });

  it('shows error message on API failure', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'Too many requests' }));
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByPlaceholderText(/your@example\.com/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByText('Too many requests')).toBeInTheDocument()
    );
  });
});

// ─── ResetPasswordForm (FE-005) ───────────────────────────────────────────────

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    useSearchParams.mockReturnValue({
      get: (key) => ({ email: 'user@example.com', token: 'reset-token-123' }[key] || null),
    });
  });

  it('renders new password and confirm fields', () => {
    render(<ResetPasswordForm />);
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });

  it('shows success message after valid password reset', async () => {
    global.fetch.mockResolvedValueOnce(ok({ message: 'Password reset' }));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'NewPassword1');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'NewPassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument()
    );
  });

  it('shows error on invalid or expired token', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'Invalid or expired token' }));
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByPlaceholderText(/at least 8 characters/i), 'NewPassword1');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'NewPassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() =>
      expect(screen.getByText('Invalid or expired token')).toBeInTheDocument()
    );
  });
});

// ─── VerifyEmailForm (FE-003) ─────────────────────────────────────────────────

describe('VerifyEmailForm', () => {
  beforeEach(() => {
    // email present, no token (manual entry mode)
    useSearchParams.mockReturnValue({
      get: (key) => ({ email: 'user@example.com' }[key] || null),
    });
  });

  it('renders verify email form with email pre-filled', () => {
    render(<VerifyEmailForm />);
    expect(screen.getByRole('heading', { name: /verify email/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter token from email/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });

  it('submit button is disabled when token field is empty', () => {
    render(<VerifyEmailForm />);
    expect(screen.getByRole('button', { name: /verify email/i })).toBeDisabled();
  });

  it('shows success message after valid token submission', async () => {
    global.fetch.mockResolvedValueOnce(ok({ message: 'Verified' }));
    const user = userEvent.setup();
    render(<VerifyEmailForm />);
    await user.type(screen.getByPlaceholderText(/enter token from email/i), 'valid-token-abc');
    await user.click(screen.getByRole('button', { name: /verify email/i }));
    await waitFor(() =>
      expect(screen.getByText(/email verified/i)).toBeInTheDocument()
    );
  });

  it('shows error on invalid token', async () => {
    global.fetch.mockResolvedValueOnce(fail({ detail: 'Token is invalid or expired' }));
    const user = userEvent.setup();
    render(<VerifyEmailForm />);
    await user.type(screen.getByPlaceholderText(/enter token from email/i), 'bad-token');
    await user.click(screen.getByRole('button', { name: /verify email/i }));
    await waitFor(() =>
      expect(screen.getByText('Token is invalid or expired')).toBeInTheDocument()
    );
  });
});
