/**
 * Tests for FE-006 to FE-007: Blog pages
 * Covers: BlogPostsPage (/blog/posts/), BlogDetailPage (/blog/[slug]/)
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import BlogPostsPage from '@/app/blog/posts/page';
import BlogDetailPage from '@/app/blog/[slug]/page';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

jest.mock('@/components/LexicalRenderer', () => {
  function MockLexicalRenderer() {
    return <div data-testid="lexical-renderer">Post Content</div>;
  }
  return MockLexicalRenderer;
});

const mockUseAuth = jest.fn();
jest.mock('@/components/authProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_POSTS = [
  {
    id: 1,
    title: 'First Post',
    slug: 'first-post',
    author: { id: 1, username: 'author1', email: 'a@a.com' },
    categories: [{ id: 1, name: 'Tech', slug: 'tech', created_at: '2026-01-01T00:00:00Z' }],
    status: 'published',
    view_count: 10,
    created_at: '2026-01-01T00:00:00Z',
    published_at: '2026-01-01T00:00:00Z',
    featured_image_url: null,
  },
];

const SAMPLE_POST = {
  ...SAMPLE_POSTS[0],
  content_json: JSON.stringify({ root: { children: [], type: 'root', version: 1 } }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: async () => data });
const fail = (data = { detail: 'Error' }, status = 500) =>
  Promise.resolve({ ok: false, status, json: async () => data });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  useRouter.mockReturnValue({ push: jest.fn(), replace: jest.fn() });
  useParams.mockReturnValue({ slug: 'first-post' });
  useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue(null) });
  usePathname.mockReturnValue('/');
  mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
});

// ─── BlogPostsPage (FE-006) ───────────────────────────────────────────────────

describe('BlogPostsPage', () => {
  it('shows loading state while fetching', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<BlogPostsPage />);
    expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
  });

  it('renders post cards after successful fetch', async () => {
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POSTS));
    render(<BlogPostsPage />);
    await waitFor(() =>
      expect(screen.getByText('First Post')).toBeInTheDocument()
    );
    expect(screen.getByText('Tech')).toBeInTheDocument();
    // Post card links to slug page
    expect(screen.getByRole('link', { name: /first post/i })).toHaveAttribute(
      'href',
      '/blog/first-post'
    );
  });

  it('shows empty state when no posts returned', async () => {
    global.fetch.mockResolvedValueOnce(ok([]));
    render(<BlogPostsPage />);
    await waitFor(() =>
      expect(screen.getByText(/no blog posts yet/i)).toBeInTheDocument()
    );
  });

  it('shows error state when fetch fails', async () => {
    global.fetch.mockResolvedValueOnce(fail());
    render(<BlogPostsPage />);
    await waitFor(() =>
      expect(screen.getByText(/Error: Failed to fetch blog posts/i)).toBeInTheDocument()
    );
  });

  it('shows Create Post link for authenticated editor', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    global.fetch
      .mockResolvedValueOnce(ok(SAMPLE_POSTS))                              // posts
      .mockResolvedValueOnce(ok({ profile: { role: 'editor' } }));          // me
    render(<BlogPostsPage />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /create post/i })).toBeInTheDocument()
    );
  });

  it('does not show Create Post link for unauthenticated visitors', async () => {
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POSTS));
    render(<BlogPostsPage />);
    await waitFor(() =>
      expect(screen.getByText('First Post')).toBeInTheDocument()
    );
    expect(screen.queryByRole('link', { name: /create post/i })).not.toBeInTheDocument();
  });
});

// ─── BlogDetailPage (FE-007) ──────────────────────────────────────────────────

describe('BlogDetailPage', () => {
  it('shows loading state while fetching', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<BlogDetailPage />);
    expect(screen.getByText(/loading post/i)).toBeInTheDocument();
  });

  it('renders post title, author, and content after fetch', async () => {
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POST));
    render(<BlogDetailPage />);
    await waitFor(() =>
      expect(screen.getByText('First Post')).toBeInTheDocument()
    );
    expect(screen.getByText(/author1/i)).toBeInTheDocument();
    expect(screen.getByTestId('lexical-renderer')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('shows back to posts link', async () => {
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POST));
    render(<BlogDetailPage />);
    await waitFor(() =>
      expect(screen.getByText('First Post')).toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: /back to posts/i })).toHaveAttribute(
      'href',
      '/blog/posts'
    );
  });

  it('shows error state when fetch fails', async () => {
    global.fetch.mockResolvedValueOnce(fail());
    render(<BlogDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/Error: Failed to fetch blog post/i)).toBeInTheDocument()
    );
  });

  it('shows back link on error state too', async () => {
    global.fetch.mockResolvedValueOnce(fail());
    render(<BlogDetailPage />);
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /back to posts/i })).toBeInTheDocument()
    );
  });
});
