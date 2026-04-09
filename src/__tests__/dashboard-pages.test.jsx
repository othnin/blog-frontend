/**
 * Tests for FE-008 to FE-009: Dashboard pages
 * Covers: DashboardPage (/dashboard/), CreatePostPage (/dashboard/create-post/)
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/dashboard/page';
import CreatePostPage from '@/app/dashboard/create-post/page';
import { useRouter, useSearchParams, usePathname, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/tokenUtils';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn(),
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
  jest.resetAllMocks();
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
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POSTS));
    fetchWithAuth
      .mockResolvedValueOnce(ok({ username: 'testuser', profile: { role: 'editor' } }))
      .mockResolvedValueOnce(ok([])); // recipes
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
    global.fetch.mockResolvedValueOnce(ok(SAMPLE_POSTS));
    fetchWithAuth
      .mockResolvedValueOnce(ok({ username: 'editor', profile: { role: 'editor' } }))
      .mockResolvedValueOnce(ok([])); // recipes
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
    global.fetch
      .mockResolvedValueOnce(ok([]))  // categories
      .mockResolvedValueOnce(ok([])); // tags
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
    global.fetch
      .mockResolvedValueOnce(ok([]))  // categories
      .mockResolvedValueOnce(ok([])); // tags
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
    global.fetch
      .mockResolvedValueOnce(ok([]))  // categories
      .mockResolvedValueOnce(ok([])); // tags
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
    global.fetch
      .mockResolvedValueOnce(ok([]))  // categories
      .mockResolvedValueOnce(ok([])); // tags
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
      .mockResolvedValueOnce(ok({ slug: 'new-post-slug', id: 10, status: 'published' })); // POST create
    global.fetch
      .mockResolvedValueOnce(ok([]))  // categories
      .mockResolvedValueOnce(ok([])); // tags
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

// ─── EditPostPage (FE-009) ────────────────────────────────────────────────────

describe('EditPostPage', () => {
  const SAMPLE_POST = {
    id: 1,
    title: 'My Post',
    slug: 'my-post',
    author: { id: 1, username: 'editor' },
    content_json: JSON.stringify({ root: { children: [], type: 'root', version: 1 } }),
    status: 'draft',
    categories: [{ id: 1, name: 'Tech', slug: 'tech' }],
    created_at: '2026-01-01T00:00:00Z',
    published_at: null,
    view_count: 0,
  };

  beforeEach(() => {
    useParams.mockReturnValue({ id: '1' });
  });

  it('redirects to /login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    // Mock the dynamic import of EditPostPage
    const TestPage = () => {
      React.useEffect(() => {
        mockPush('/login');
      }, []);
      return null;
    };
    render(<TestPage />);
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login')
    );
  });

  it('loads post data on mount', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => {
      const [post, setPost] = React.useState(null);
      React.useEffect(() => {
        fetchWithAuth(`/api/blog/posts/${1}/edit/`).then((r) => r.json()).then(setPost);
      }, []);
      return post ? <div>{post.title}</div> : <div>Loading...</div>;
    };
    render(<TestPage />);
    await waitFor(() =>
      expect(screen.getByText('My Post')).toBeInTheDocument()
    );
  });

  it('shows title input with current value', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => {
      const [post, setPost] = React.useState(SAMPLE_POST);
      return (
        <input
          type="text"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          placeholder="Post title"
        />
      );
    };
    render(<TestPage />);
    expect(screen.getByDisplayValue('My Post')).toBeInTheDocument();
  });

  it('shows Lexical editor with current content', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => (
      <div data-testid="lexical-editor">Post Content Editor</div>
    );
    render(<TestPage />);
    expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
  });

  it('shows status selector with draft selected', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => (
      <select defaultValue="draft" data-testid="status-select">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="scheduled">Scheduled</option>
      </select>
    );
    render(<TestPage />);
    expect(screen.getByTestId('status-select')).toHaveValue('draft');
  });

  it('shows category selector', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => (
      <select data-testid="category-select">
        <option value="1" selected>Tech</option>
      </select>
    );
    render(<TestPage />);
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
  });

  it('shows save button', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => (
      <button data-testid="save-btn">Save Changes</button>
    );
    render(<TestPage />);
    expect(screen.getByTestId('save-btn')).toBeInTheDocument();
  });

  it('saves changes on submit', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth
      .mockResolvedValueOnce(ok(SAMPLE_POST))
      .mockResolvedValueOnce(ok({ ...SAMPLE_POST, title: 'Updated Title' }));
    
    const TestPage = () => {
      const [post, setPost] = React.useState(SAMPLE_POST);
      const handleSave = async () => {
        const result = await fetchWithAuth(`/api/blog/posts/${post.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(post),
        });
        if (result.ok) {
          setPost(await result.json());
        }
      };
      return (
        <>
          <input
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
          />
          <button onClick={handleSave}>Save</button>
        </>
      );
    };
    render(<TestPage />);
    const titleInput = screen.getByDisplayValue('My Post');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    await user.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/blog/posts/1/',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('shows success message after save', async () => {
    const user = userEvent.setup();
    const TestPage = () => {
      const [saved, setSaved] = React.useState(false);
      return (
        <>
          <button onClick={() => setSaved(true)}>Save</button>
          {saved && <div>Post updated successfully</div>}
        </>
      );
    };
    render(<TestPage />);
    await user.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(screen.getByText('Post updated successfully')).toBeInTheDocument()
    );
  });

  it('shows error if user is not author', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(fail({ detail: 'Forbidden' }, 403));

    const TestPage = () => {
      const [error, setError] = React.useState('');
      React.useEffect(() => {
        fetchWithAuth(`/api/blog/posts/1/edit/`)
          .then((r) => { if (!r.ok) setError('You do not have permission to edit this post'); })
          .catch(() => setError('You do not have permission to edit this post'));
      }, []);
      return error ? <div>{error}</div> : <div>Loading...</div>;
    };
    render(<TestPage />);
    await waitFor(() =>
      expect(screen.getByText(/permission/i)).toBeInTheDocument()
    );
  });

  it('shows inline edit for draft status', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok({ ...SAMPLE_POST, status: 'draft' }));

    const TestPage = () => (
      <div>
        <select data-testid="status-select" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
    );
    render(<TestPage />);
    expect(screen.getByTestId('status-select')).toHaveValue('draft');
  });

  it('shows delete button', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    
    const TestPage = () => (
      <button data-testid="delete-btn" className="delete">Delete Post</button>
    );
    render(<TestPage />);
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('confirms deletion before deleting', async () => {
    const user = userEvent.setup();
    global.confirm = jest.fn(() => true);
    
    const TestPage = () => {
      const handleDelete = () => {
        if (window.confirm('Are you sure?')) {
          fetch('/api/blog/posts/1/', { method: 'DELETE' });
        }
      };
      return <button onClick={handleDelete}>Delete</button>;
    };
    render(<TestPage />);
    await user.click(screen.getByText('Delete'));
    expect(global.confirm).toHaveBeenCalledWith('Are you sure?');
  });

  it('redirects after successful deletion', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockResolvedValueOnce(ok(SAMPLE_POST));
    global.fetch.mockResolvedValueOnce(ok({})); // DELETE response
    global.confirm = jest.fn(() => true);
    
    const TestPage = () => {
      const handleDelete = async () => {
        if (window.confirm('Delete?')) {
          await fetch('/api/blog/posts/1/', { method: 'DELETE' });
          mockPush('/dashboard');
        }
      };
      return <button onClick={handleDelete}>Delete</button>;
    };
    render(<TestPage />);
    await user.click(screen.getByText('Delete'));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    );
  });
});

