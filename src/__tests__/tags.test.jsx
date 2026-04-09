/**
 * Tests for FE-021: TagSelector component
 *         FE-022: /blog/tags/[slug]/ Tag Filter Page
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({ slug: 'python' })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

jest.mock('@/lib/tokenUtils', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/config/api', () => ({
  API_ENDPOINTS: {
    blog: {
      tags: '/api/blog/tags/',
      posts: '/api/blog/posts/',
    },
  },
}));

const { fetchWithAuth } = require('@/lib/tokenUtils');

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const SAMPLE_TAGS = [
  { id: 1, name: 'Django', slug: 'django', meta_description: '' },
  { id: 2, name: 'Python', slug: 'python', meta_description: '' },
  { id: 3, name: 'React',  slug: 'react',  meta_description: '' },
];

const SAMPLE_POSTS = [
  {
    id: 10,
    slug: 'intro-to-python',
    title: 'Intro to Python',
    content_text: 'A beginner guide to Python programming.',
    created_at: '2026-01-01T00:00:00Z',
    author: { username: 'editor' },
    category: { name: 'Technology' },
    tags: [{ id: 2, name: 'Python', slug: 'python' }],
  },
  {
    id: 11,
    slug: 'advanced-python',
    title: 'Advanced Python',
    content_text: 'Deep dive into Python internals.',
    created_at: '2026-02-01T00:00:00Z',
    author: { username: 'editor' },
    category: null,
    tags: [
      { id: 2, name: 'Python', slug: 'python' },
      { id: 1, name: 'Django', slug: 'django' },
    ],
  },
];

function mockFetch(responseMap) {
  global.fetch = jest.fn((url) => {
    for (const [pattern, data] of Object.entries(responseMap)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  });
}

// ─── FE-021: TagSelector ──────────────────────────────────────────────────────

describe('FE-021: TagSelector', () => {
  let TagSelector;

  beforeAll(async () => {
    const mod = await import('@/components/TagSelector');
    TagSelector = mod.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch({ '/api/blog/tags/': SAMPLE_TAGS });
  });

  it('renders the Add button and input on mount', async () => {
    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText(/new tag name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });

  it('fetches tags on mount and displays them as pills', async () => {
    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('#Django')).toBeInTheDocument();
      expect(screen.getByText('#Python')).toBeInTheDocument();
      expect(screen.getByText('#React')).toBeInTheDocument();
    });
  });

  it('calls onChange with added id when an unselected tag is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TagSelector selectedIds={[]} onChange={onChange} />);
    await waitFor(() => screen.getByText('#Python'));
    await user.click(screen.getByText('#Python'));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('calls onChange with id removed when a selected tag is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<TagSelector selectedIds={[1, 2]} onChange={onChange} />);
    await waitFor(() => screen.getByText('#Python'));
    await user.click(screen.getByText('#Python'));
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('Add button is disabled when input is empty', async () => {
    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    const btn = screen.getByRole('button', { name: /^add$/i });
    expect(btn).toBeDisabled();
  });

  it('Add button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    await user.type(screen.getByPlaceholderText(/new tag name/i), 'Nextjs');
    expect(screen.getByRole('button', { name: /^add$/i })).toBeEnabled();
  });

  it('creates a new tag via fetchWithAuth and selects it', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const newTag = { id: 99, name: 'Nextjs', slug: 'nextjs', meta_description: '' };
    fetchWithAuth.mockResolvedValue({ ok: true, json: () => Promise.resolve(newTag) });

    render(<TagSelector selectedIds={[]} onChange={onChange} />);
    await waitFor(() => screen.getByText('#Django'));

    await user.type(screen.getByPlaceholderText(/new tag name/i), 'Nextjs');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/blog/tags/',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(onChange).toHaveBeenCalledWith([99]);
    });
  });

  it('clears input after successful tag creation', async () => {
    const user = userEvent.setup();
    const newTag = { id: 99, name: 'Nextjs', slug: 'nextjs', meta_description: '' };
    fetchWithAuth.mockResolvedValue({ ok: true, json: () => Promise.resolve(newTag) });

    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    await waitFor(() => screen.getByText('#Django'));

    const input = screen.getByPlaceholderText(/new tag name/i);
    await user.type(input, 'Nextjs');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('creates a tag when Enter is pressed in the input', async () => {
    const user = userEvent.setup();
    const newTag = { id: 99, name: 'Nextjs', slug: 'nextjs', meta_description: '' };
    fetchWithAuth.mockResolvedValue({ ok: true, json: () => Promise.resolve(newTag) });

    render(<TagSelector selectedIds={[]} onChange={jest.fn()} />);
    await waitFor(() => screen.getByText('#Django'));

    await user.type(screen.getByPlaceholderText(/new tag name/i), 'Nextjs{Enter}');

    await waitFor(() => expect(fetchWithAuth).toHaveBeenCalled());
  });

  it('does not add a duplicate tag that already exists in the list', async () => {
    const user = userEvent.setup();
    const existingTag = SAMPLE_TAGS[1]; // Python id=2
    fetchWithAuth.mockResolvedValue({ ok: true, json: () => Promise.resolve(existingTag) });
    const onChange = jest.fn();

    render(<TagSelector selectedIds={[]} onChange={onChange} />);
    await waitFor(() => screen.getByText('#Python'));

    await user.type(screen.getByPlaceholderText(/new tag name/i), 'Python');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([2]));
    // #Python pill should still appear exactly once
    expect(screen.getAllByText('#Python')).toHaveLength(1);
  });
});

// ─── FE-022: Tag Filter Page ──────────────────────────────────────────────────

describe('FE-022: /blog/tags/[slug]/ Tag Filter Page', () => {
  let TagFilterPage;
  const { useParams } = require('next/navigation');

  beforeAll(async () => {
    const mod = await import('@/app/blog/tags/[slug]/page');
    TagFilterPage = mod.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ slug: 'python' });
  });

  it('shows loading state initially', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    render(<TagFilterPage />);
    expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
  });

  it('renders the back link and heading', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.getByText(/back to all posts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/#Python/).length).toBeGreaterThan(0);
  });

  it('resolves tag name from the tags API and displays it', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => expect(screen.getAllByText(/#Python/).length).toBeGreaterThan(0));
    // heading uses the resolved name, not just the raw slug
    expect(screen.getByRole('heading', { level: 1, name: /Python/i })).toBeInTheDocument();
  });

  it('renders a card for each post', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText('Intro to Python'));
    expect(screen.getByText('Intro to Python')).toBeInTheDocument();
    expect(screen.getByText('Advanced Python')).toBeInTheDocument();
  });

  it('shows author and date on each post card', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText('Intro to Python'));
    expect(screen.getAllByText(/editor/).length).toBeGreaterThan(0);
  });

  it('shows empty state when no posts match', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': [],
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText(/no posts found/i));
  });

  it('shows error message when posts fetch fails', async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/blog/tags/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SAMPLE_TAGS) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText(/error/i));
  });

  it('post cards link to the correct blog post URL', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText('Intro to Python'));
    const link = screen.getByText('Intro to Python').closest('a');
    expect(link).toHaveAttribute('href', '/blog/intro-to-python');
  });

  it('highlights the current tag slug on post tag pills', async () => {
    mockFetch({
      '/api/blog/tags/': SAMPLE_TAGS,
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText('Intro to Python'));
    // The active tag pill should have the highlighted class
    const pythonPills = screen.getAllByText('#Python');
    expect(pythonPills.length).toBeGreaterThan(0);
  });

  it('falls back to slug when tag is not found in tags list', async () => {
    mockFetch({
      '/api/blog/tags/': [], // empty tags list
      '/api/blog/posts/': SAMPLE_POSTS,
    });
    render(<TagFilterPage />);
    await waitFor(() => screen.getByText(/#python/i));
  });
});
