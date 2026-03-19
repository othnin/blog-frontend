/**
 * Tests for FE-008 to FE-009: Dashboard pages
 * Covers: DashboardPage (/dashboard/), CreatePostPage (/dashboard/create-post/)
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/dashboard/page';
import CreatePostPage from '@/app/dashboard/create-post/page';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { fetchWithAuth } from '@/lib/tokenUtils';

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

jest.mock('@/components/LexicalEditor', () => {
  function MockLexicalEditor({ onChange }) {
    return (
      <div data-testid="lexical-editor">
        <button type="button" onClick={() => onChange('{"root":{}}')}>
          Edit Content
        </button>
      </div>
    );
  }
  return MockLexicalEditor;
});

jest.mock('@/lib/tokenUtils', () => ({
  fetchWithAuth: jest.fn(),
}));

const mockUseAuth = jest.fn();
jest.mock('@/components/authProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_POSTS = [
  {
    id: 1,
    title: 'My Draft Post',
    slug: 'my-draft-post',
    status: 'draft',
    view_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    published_at: null,
  },
  {
    id: 2,
    title: 'My Published Post',
    slug: 'my-published-post',
    status: 'published',
    view_count: 5,
    created_at: '2026-01-01T00:00:00Z',
    published_at: '2026-02-01T00:00:00Z',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: async () => data });
const fail = (data = { detail: 'Error' }, status = 400) =>
  Promise.resolve({ ok: false, status, json: async () => data });

const mockPush = jest.fn();
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  localStorage.clear();
  localStorage.setItem('access_token', 'test-token');
  useRouter.mockReturnValue({ push: mockPush, replace: mockReplace });
  useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) });
  usePathname.mockReturnValue('/dashboard');
  // Suppress debug console.log statements in CreatePostPage
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

// ─── DashboardPage (FE-008) ───────────────────────────────────────────────────

describe('DashboardPage', () => {
  it('redirects to /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    render(<DashboardPage />);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login')
    );
  });

  it('renders Dashboard heading and user greeting when authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    global.fetch
      .mockResolvedValueOnce(ok(SAMPLE_POSTS))
      .mockResolvedValueOnce(ok({ username: 'testuser', profile: { role: 'editor' } }));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    );
    expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
  });

  it('shows all posts with their statuses', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    global.fetch
      .mockResolvedValueOnce(ok(SAMPLE_POSTS))
      .mockResolvedValueOnce(ok({ username: 'testuser', profile: { role: 'editor' } }));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText('My Draft Post')).toBeInTheDocument()
    );
    expect(screen.getByText('My Published Post')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
  });

  it('shows Create New Post button for editor role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    global.fetch
      .mockResolvedValueOnce(ok(SAMPLE_POSTS))
      .mockResolvedValueOnce(ok({ username: 'editor', profile: { role: 'editor' } }));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /create new post/i })).toBeInTheDocument()
    );
  });

  it('shows empty state when user has no posts', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    global.fetch
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok({ username: 'reader', profile: { role: 'reader' } }));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/no posts available/i)).toBeInTheDocument()
    );
  });
});

// ─── CreatePostPage (FE-009) ──────────────────────────────────────────────────

describe('CreatePostPage', () => {
  it('redirects to /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    global.fetch.mockResolvedValue(ok([])); // categories
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login')
    );
  });

  it('renders create post form for editor role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(
      ok({ username: 'editor', profile: { role: 'editor' } })
    );
    global.fetch.mockResolvedValueOnce(ok([])); // categories
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument()
    );
    expect(screen.getByPlaceholderText(/enter blog post title/i)).toBeInTheDocument();
    expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
  });

  it('renders create post form for admin role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(
      ok({ username: 'admin', profile: { role: 'admin' } })
    );
    global.fetch.mockResolvedValueOnce(ok([]));
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument()
    );
  });

  it('shows permission error for reader role', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(
      ok({ username: 'reader', profile: { role: 'reader' } })
    );
    global.fetch.mockResolvedValueOnce(ok([]));
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/you don't have permission to create posts/i)
      ).toBeInTheDocument()
    );
  });

  it('shows error when submitting with empty title', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(
      ok({ username: 'editor', profile: { role: 'editor' } })
    );
    global.fetch.mockResolvedValueOnce(ok([]));
    const user = userEvent.setup();
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument()
    );
    // Type whitespace only — satisfies HTML `required` but fails JS .trim() check
    await user.type(screen.getByPlaceholderText(/enter blog post title/i), '   ');
    await user.click(screen.getByRole('button', { name: /create post/i }));
    await waitFor(() =>
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    );
  });

  it('redirects to post detail after successful creation', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth
      .mockResolvedValueOnce(ok({ username: 'editor', profile: { role: 'editor' } }))
      .mockResolvedValueOnce(ok({ slug: 'new-post-slug', id: 10 })); // POST create
    global.fetch.mockResolvedValueOnce(ok([]));
    const user = userEvent.setup();
    render(<CreatePostPage />);
    await waitFor(() =>
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument()
    );
    await user.type(screen.getByPlaceholderText(/enter blog post title/i), 'New Post');
    await user.click(screen.getByRole('button', { name: /create post/i }));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/blog/new-post-slug')
    );
  });
});
