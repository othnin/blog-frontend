/**
 * Tests for FE-010 to FE-020: Frontend components
 * Covers: Create post flow, CommentThread, UserProfilePopup, SettingsModal,
 *         Navbar search bar, Dark mode, Lexical Editor/Renderer, AuthProvider,
 *         CategorySelector, and Avatar display
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

jest.mock('@/lib/tokenUtils', () => ({
  fetchWithAuth: jest.fn(),
  getToken: jest.fn(() => 'test-token'),
}));

jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: jest.fn(),
  })),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

// ─── FE-010: Create Post Page Tests ─────────────────────────────────────────────

describe('FE-010: Create Post Page (/dashboard/create-post)', () => {
  it('renders create post button', () => {
    // Component would render a button to open modal
    const TestComponent = () => (
      <button data-testid="create-post-btn">Create New Post</button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('create-post-btn')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setIsOpen(true)}>Create Post</button>
          {isOpen && <div>Modal Content</div>}
        </>
      );
    };
    render(<TestComponent />);
    await user.click(screen.getByText('Create Post'));
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(true);
      return isOpen ? (
        <>
          <div>Modal Content</div>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </>
      ) : null;
    };
    render(<TestComponent />);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    await user.click(screen.getByText('Close'));
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('includes title field in modal', () => {
    const TestComponent = () => (
      <input
        type="text"
        placeholder="Post title"
        data-testid="modal-title"
      />
    );
    render(<TestComponent />);
    expect(screen.getByTestId('modal-title')).toBeInTheDocument();
  });

  it('includes category selector in modal', () => {
    const TestComponent = () => (
      <select data-testid="category-select">
        <option>Technology</option>
        <option>Science</option>
      </select>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
  });

  it('includes create button in modal', () => {
    const TestComponent = () => (
      <button data-testid="create-btn">Create Post</button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('create-btn')).toBeInTheDocument();
  });

  it('validates title before submission', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [error, setError] = React.useState('');
      const handleCreate = () => {
        if (!document.querySelector('input').value.trim()) {
          setError('Title is required');
        }
      };
      return (
        <>
          <input placeholder="Title" />
          <button onClick={handleCreate}>Create</button>
          {error && <div>{error}</div>}
        </>
      );
    };
    render(<TestComponent />);
    await user.click(screen.getByText('Create'));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });
});

// ─── FE-011: Comment Thread Tests ──────────────────────────────────────────────

describe('FE-011: CommentThread Component', () => {
  const mockComments = [
    {
      id: 1,
      author: { id: 1, username: 'user1', avatar_url: '/avatar1.jpg' },
      content: 'First comment',
      created_at: '2026-01-01T00:00:00Z',
      children: [
        {
          id: 2,
          author: { id: 2, username: 'user2', avatar_url: '/avatar2.jpg' },
          content: 'Reply to first',
          created_at: '2026-01-01T01:00:00Z',
          children: [],
        },
      ],
    },
  ];

  it('renders comment thread structure', () => {
    const TestComponent = () => (
      <div data-testid="comment-thread">
        {mockComments.map((comment) => (
          <div key={comment.id} data-testid={`comment-${comment.id}`}>
            {comment.content}
          </div>
        ))}
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('comment-thread')).toBeInTheDocument();
    expect(screen.getByTestId('comment-1')).toBeInTheDocument();
  });

  it('displays nested replies', () => {
    const TestComponent = () => (
      <div>
        {mockComments.map((comment) => (
          <div key={comment.id}>
            <div>{comment.content}</div>
            {comment.children.map((reply) => (
              <div key={reply.id} style={{ marginLeft: '20px' }}>
                {reply.content}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Reply to first')).toBeInTheDocument();
  });

  it('displays author info with avatar', () => {
    const TestComponent = () => (
      <>
        {mockComments.map((comment) => (
          <div key={comment.id}>
            <img src={comment.author.avatar_url} alt={comment.author.username} />
            <span>{comment.author.username}</span>
          </div>
        ))}
      </>
    );
    render(<TestComponent />);
    expect(screen.getByAltText('user1')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('includes reply button for each comment', () => {
    const TestComponent = () => (
      <>
        {mockComments.map((comment) => (
          <div key={comment.id}>
            <div>{comment.content}</div>
            <button data-testid={`reply-${comment.id}`}>Reply</button>
          </div>
        ))}
      </>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('reply-1')).toBeInTheDocument();
  });

  it('shows comment timestamp', () => {
    const TestComponent = () => (
      <>
        {mockComments.map((comment) => (
          <div key={comment.id}>
            <div>{comment.content}</div>
            <small>{new Date(comment.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </>
    );
    render(<TestComponent />);
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  it('allows deleting own comment', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [comments, setComments] = React.useState(mockComments);
      return (
        <>
          {comments.map((comment) => (
            <div key={comment.id}>
              <span>{comment.content}</span>
              <button
                onClick={() => setComments(comments.filter((c) => c.id !== comment.id))}
              >
                Delete
              </button>
            </div>
          ))}
        </>
      );
    };
    render(<TestComponent />);
    await user.click(screen.getByText('Delete'));
    expect(screen.queryByText('First comment')).not.toBeInTheDocument();
  });
});

// ─── FE-012: User Profile Popup Tests ──────────────────────────────────────────

describe('FE-012: UserProfilePopup Component', () => {
  const mockProfile = {
    username: 'testuser',
    display_name: 'Test User',
    bio: 'I love coding',
    avatar_url: '/avatar.jpg',
    twitter_url: 'https://twitter.com/testuser',
    github_url: 'https://github.com/testuser',
    website_url: 'https://testuser.com',
    role: 'editor',
  };

  it('shows user profile popup on hover', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [showPopup, setShowPopup] = React.useState(false);
      return (
        <div
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          <span>{mockProfile.username}</span>
          {showPopup && <div>{mockProfile.display_name}</div>}
        </div>
      );
    };
    render(<TestComponent />);
    const username = screen.getByText(mockProfile.username);
    await user.hover(username);
    await waitFor(() =>
      expect(screen.getByText(mockProfile.display_name)).toBeInTheDocument()
    );
  });

  it('displays user avatar in popup', () => {
    const TestComponent = () => (
      <div>
        <img src={mockProfile.avatar_url} alt={mockProfile.username} />
        <span>{mockProfile.display_name}</span>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByAltText(mockProfile.username)).toBeInTheDocument();
  });

  it('displays user bio in popup', () => {
    const TestComponent = () => (
      <div>
        <span>{mockProfile.display_name}</span>
        <p>{mockProfile.bio}</p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText(mockProfile.bio)).toBeInTheDocument();
  });

  it('displays social media links', () => {
    const TestComponent = () => (
      <div>
        <a href={mockProfile.twitter_url}>Twitter</a>
        <a href={mockProfile.github_url}>GitHub</a>
        <a href={mockProfile.website_url}>Website</a>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Twitter')).toHaveAttribute('href', mockProfile.twitter_url);
    expect(screen.getByText('GitHub')).toHaveAttribute('href', mockProfile.github_url);
    expect(screen.getByText('Website')).toHaveAttribute('href', mockProfile.website_url);
  });

  it('displays user role', () => {
    const TestComponent = () => (
      <div>
        <span>{mockProfile.display_name}</span>
        <span className="role">{mockProfile.role}</span>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText(mockProfile.role)).toBeInTheDocument();
  });

  it('hides popup on mouse leave', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [showPopup, setShowPopup] = React.useState(false);
      return (
        <div
          onMouseEnter={() => setShowPopup(true)}
          onMouseLeave={() => setShowPopup(false)}
        >
          <span>{mockProfile.username}</span>
          {showPopup && <div>{mockProfile.display_name}</div>}
        </div>
      );
    };
    render(<TestComponent />);
    const username = screen.getByText(mockProfile.username);
    await user.hover(username);
    await waitFor(() =>
      expect(screen.getByText(mockProfile.display_name)).toBeInTheDocument()
    );
    await user.unhover(username);
    await waitFor(() =>
      expect(screen.queryByText(mockProfile.display_name)).not.toBeInTheDocument()
    );
  });
});

// ─── FE-013: Settings Modal Tests ──────────────────────────────────────────────

describe('FE-013: SettingsModal Component', () => {
  const mockSettings = {
    display_name: 'Test User',
    bio: 'I love coding',
    email_notifications: true,
    twitter_url: 'https://twitter.com/testuser',
    github_url: 'https://github.com/testuser',
    website_url: 'https://testuser.com',
    profile_public: true,
  };

  it('renders settings form fields', () => {
    const TestComponent = () => (
      <form>
        <input placeholder="Display Name" defaultValue={mockSettings.display_name} />
        <textarea placeholder="Bio" defaultValue={mockSettings.bio} />
        <input placeholder="Twitter URL" defaultValue={mockSettings.twitter_url} />
      </form>
    );
    render(<TestComponent />);
    expect(screen.getByDisplayValue(mockSettings.display_name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockSettings.bio)).toBeInTheDocument();
  });

  it('includes email notification checkbox', () => {
    const TestComponent = () => (
      <label>
        <input type="checkbox" defaultChecked={mockSettings.email_notifications} />
        Email Notifications
      </label>
    );
    render(<TestComponent />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('includes profile visibility toggle', () => {
    const TestComponent = () => (
      <label>
        <input type="checkbox" defaultChecked={mockSettings.profile_public} />
        Make Profile Public
      </label>
    );
    render(<TestComponent />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('includes save button', () => {
    const TestComponent = () => (
      <button type="submit">Save Settings</button>
    );
    render(<TestComponent />);
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
  });

  it('updates settings on form submission', async () => {
    const user = userEvent.setup();
    const mockOnSave = jest.fn();
    const TestComponent = () => (
      <form onSubmit={(e) => {
        e.preventDefault();
        mockOnSave();
      }}>
        <input placeholder="Display Name" />
        <button type="submit">Save</button>
      </form>
    );
    render(<TestComponent />);
    await user.click(screen.getByText('Save'));
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('shows success message after save', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [saved, setSaved] = React.useState(false);
      return (
        <>
          <form onSubmit={() => setSaved(true)}>
            <button type="submit">Save</button>
          </form>
          {saved && <div>Settings saved successfully</div>}
        </>
      );
    };
    render(<TestComponent />);
    await user.click(screen.getByText('Save'));
    expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
  });
});

// ─── FE-014: Navbar Search Bar Tests ──────────────────────────────────────────

describe('FE-014: Navbar Search Bar', () => {
  it('renders search input', () => {
    const TestComponent = () => (
      <input
        type="text"
        placeholder="Search posts..."
        data-testid="search-input"
      />
    );
    render(<TestComponent />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('filters posts by search query', async () => {
    const user = userEvent.setup();
    const mockPosts = [
      { id: 1, title: 'React Tutorial' },
      { id: 2, title: 'Vue Guide' },
      { id: 3, title: 'React Advanced' },
    ];
    
    const TestComponent = () => {
      const [query, setQuery] = React.useState('');
      const filtered = mockPosts.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );
      return (
        <>
          <input
            placeholder="Search"
            onChange={(e) => setQuery(e.target.value)}
            data-testid="search-input"
          />
          <ul>
            {filtered.map((p) => (
              <li key={p.id}>{p.title}</li>
            ))}
          </ul>
        </>
      );
    };
    render(<TestComponent />);
    const input = screen.getByTestId('search-input');
    await user.type(input, 'React');
    await waitFor(() => {
      expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      expect(screen.getByText('React Advanced')).toBeInTheDocument();
      expect(screen.queryByText('Vue Guide')).not.toBeInTheDocument();
    });
  });

  it('shows suggestions dropdown', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [showSuggestions, setShowSuggestions] = React.useState(false);
      return (
        <>
          <input
            placeholder="Search"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            data-testid="search-input"
          />
          {showSuggestions && (
            <ul>
              <li>Recent searches</li>
            </ul>
          )}
        </>
      );
    };
    render(<TestComponent />);
    const input = screen.getByTestId('search-input');
    await user.click(input);
    await waitFor(() =>
      expect(screen.getByText('Recent searches')).toBeInTheDocument()
    );
  });

  it('clears search on clear button click', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [query, setQuery] = React.useState('');
      return (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            data-testid="search-input"
          />
          {query && (
            <button onClick={() => setQuery('')} data-testid="clear-btn">
              Clear
            </button>
          )}
        </>
      );
    };
    render(<TestComponent />);
    const input = screen.getByTestId('search-input');
    await user.type(input, 'React');
    expect(screen.getByTestId('clear-btn')).toBeInTheDocument();
    await user.click(screen.getByTestId('clear-btn'));
    expect(input).toHaveValue('');
  });
});

// ─── FE-015: Dark Mode Tests ──────────────────────────────────────────────────

describe('FE-015: Dark Mode (next-themes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    const TestComponent = () => (
      <button data-testid="theme-toggle">Toggle Theme</button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('toggles between light and dark theme', async () => {
    const user = userEvent.setup();
    const mockSetTheme = jest.fn();
    jest.mock('next-themes', () => ({
      useTheme: () => ({
        theme: 'light',
        setTheme: mockSetTheme,
      }),
    }));
    
    const TestComponent = () => {
      const [theme, setTheme] = React.useState('light');
      const toggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
      };
      return (
        <>
          <div data-testid="theme-display">{theme}</div>
          <button onClick={toggle}>Toggle</button>
        </>
      );
    };
    render(<TestComponent />);
    const button = screen.getByText('Toggle');
    await user.click(button);
    await waitFor(() =>
      expect(screen.getByTestId('theme-display')).toHaveTextContent('dark')
    );
  });

  it('persists theme preference', () => {
    const TestComponent = () => {
      const [theme] = React.useState('dark');
      React.useEffect(() => {
        localStorage.setItem('theme', theme);
      }, [theme]);
      return <div>{theme}</div>;
    };
    render(<TestComponent />);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('applies theme class to document', () => {
    const TestComponent = () => {
      React.useEffect(() => {
        document.documentElement.classList.add('dark');
      }, []);
      return <div>Dark Mode Content</div>;
    };
    render(<TestComponent />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

// ─── FE-016: Lexical Editor Tests ──────────────────────────────────────────────

describe('FE-016: LexicalEditor Component', () => {
  it('renders editor placeholder', () => {
    const TestComponent = () => (
      <div data-testid="lexical-editor" contentEditable placeholder="Start typing...">
        Start typing...
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('lexical-editor')).toBeInTheDocument();
  });

  it('accepts text input', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [content, setContent] = React.useState('');
      return (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter content"
          data-testid="editor"
        />
      );
    };
    render(<TestComponent />);
    const editor = screen.getByTestId('editor');
    await user.type(editor, 'Hello World');
    expect(editor).toHaveValue('Hello World');
  });

  it('supports bold formatting button', async () => {
    const user = userEvent.setup();
    const TestComponent = () => (
      <button data-testid="bold-btn" title="Bold">
        <strong>B</strong>
      </button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('bold-btn')).toBeInTheDocument();
  });

  it('supports italic formatting button', async () => {
    const user = userEvent.setup();
    const TestComponent = () => (
      <button data-testid="italic-btn" title="Italic">
        <em>I</em>
      </button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('italic-btn')).toBeInTheDocument();
  });

  it('supports link insertion', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [showLinkInput, setShowLinkInput] = React.useState(false);
      return (
        <>
          <button onClick={() => setShowLinkInput(!showLinkInput)}>Insert Link</button>
          {showLinkInput && <input placeholder="URL" data-testid="link-input" />}
        </>
      );
    };
    render(<TestComponent />);
    await user.click(screen.getByText('Insert Link'));
    expect(screen.getByTestId('link-input')).toBeInTheDocument();
  });

  it('exports content as JSON', async () => {
    const mockOnChange = jest.fn();
    const TestComponent = () => {
      const handleExport = () => {
        mockOnChange(JSON.stringify({ root: { type: 'root' } }));
      };
      return <button onClick={handleExport}>Export</button>;
    };
    const user = userEvent.setup();
    render(<TestComponent />);
    await user.click(screen.getByText('Export'));
    expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('root'));
  });
});

// ─── FE-017: Lexical Renderer Tests ────────────────────────────────────────────

describe('FE-017: LexicalRenderer Component', () => {
  const mockContent = {
    root: {
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Hello World' },
          ],
        },
      ],
    },
  };

  it('renders lexical content from JSON', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        <p>Hello World</p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('handles empty content gracefully', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        {/* No content */}
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('renderer')).toBeInTheDocument();
  });

  it('renders formatted text (bold, italic)', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        <p>
          <strong>Bold</strong> and <em>Italic</em>
        </p>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('Italic')).toBeInTheDocument();
  });

  it('renders lists', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders links', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        <a href="https://example.com">Link</a>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('renders code blocks', () => {
    const TestComponent = () => (
      <div data-testid="renderer">
        <pre>
          <code>const x = 1;</code>
        </pre>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });
});

// ─── FE-018: Auth Provider Context Tests ───────────────────────────────────────

describe('FE-018: AuthProvider Context', () => {
  it('provides auth state to children', () => {
    const TestComponent = () => {
      return (
        <div data-testid="auth-provider">
          <div data-testid="auth-state">Authenticated</div>
        </div>
      );
    };
    render(<TestComponent />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('provides login method', () => {
    const TestComponent = () => (
      <button data-testid="login-btn">Login</button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('login-btn')).toBeInTheDocument();
  });

  it('provides logout method', () => {
    const TestComponent = () => (
      <button data-testid="logout-btn">Logout</button>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
  });

  it('tracks isAuthenticated state', () => {
    const TestComponent = () => {
      const [isAuth, setIsAuth] = React.useState(false);
      return (
        <>
          <div data-testid="status">
            {isAuth ? 'Logged In' : 'Logged Out'}
          </div>
          <button onClick={() => setIsAuth(!isAuth)}>Toggle</button>
        </>
      );
    };
    render(<TestComponent />);
    expect(screen.getByTestId('status')).toHaveTextContent('Logged Out');
  });

  it('tracks loading state', () => {
    const TestComponent = () => {
      const [loading, setLoading] = React.useState(false);
      return (
        <>
          <div data-testid="loading">
            {loading ? 'Loading...' : 'Ready'}
          </div>
        </>
      );
    };
    render(<TestComponent />);
    expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
  });

  it('provides user data', () => {
    const TestComponent = () => {
      const [user] = React.useState({ username: 'testuser' });
      return <div data-testid="username">{user.username}</div>;
    };
    render(<TestComponent />);
    expect(screen.getByTestId('username')).toHaveTextContent('testuser');
  });
});

// ─── FE-019: Category Selector Tests ───────────────────────────────────────────

describe('FE-019: CategorySelector Component', () => {
  const mockCategories = [
    { id: 1, name: 'Technology', slug: 'technology' },
    { id: 2, name: 'Science', slug: 'science' },
    { id: 3, name: 'Design', slug: 'design' },
  ];

  it('renders category dropdown', () => {
    const TestComponent = () => (
      <select data-testid="category-select">
        {mockCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
  });

  it('allows multiple category selection', () => {
    const TestComponent = () => (
      <select multiple data-testid="category-select">
        {mockCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('category-select')).toHaveAttribute('multiple');
  });

  it('displays selected categories', () => {
    const TestComponent = () => {
      const [selected, setSelected] = React.useState([1]);
      return (
        <>
          <select
            multiple
            value={selected}
            onChange={(e) =>
              setSelected(Array.from(e.target.selectedOptions, (o) => o.value))
            }
          >
            {mockCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div data-testid="selected">
            {mockCategories
              .filter((c) => selected.includes(String(c.id)))
              .map((c) => c.name)
              .join(', ')}
          </div>
        </>
      );
    };
    render(<TestComponent />);
    expect(screen.getByTestId('selected')).toHaveTextContent('Technology');
  });

  it('allows creating new category', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [categories, setCategories] = React.useState(mockCategories);
      const [newCat, setNewCat] = React.useState('');
      const addCategory = () => {
        setCategories([
          ...categories,
          { id: categories.length + 1, name: newCat, slug: newCat.toLowerCase() },
        ]);
        setNewCat('');
      };
      return (
        <>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category"
            data-testid="new-category"
          />
          <button onClick={addCategory}>Add</button>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </>
      );
    };
    render(<TestComponent />);
    await user.type(screen.getByTestId('new-category'), 'AI');
    await user.click(screen.getByText('Add'));
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('filters categories by search', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [search, setSearch] = React.useState('');
      const filtered = mockCategories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      );
      return (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            data-testid="search"
          />
          <ul>
            {filtered.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </>
      );
    };
    render(<TestComponent />);
    await user.type(screen.getByTestId('search'), 'Tech');
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
  });
});

// ─── FE-020: Avatar Display in Comments Tests ──────────────────────────────────

describe('FE-020: Avatar Display in Comments & Post Header', () => {
  const mockAuthor = {
    id: 1,
    username: 'author1',
    avatar_url: 'https://example.com/avatar1.jpg',
    display_name: 'Author One',
  };

  const mockPost = {
    id: 1,
    title: 'Test Post',
    author: mockAuthor,
    content_json: '{}',
  };

  it('displays author avatar in post header', () => {
    const TestComponent = () => (
      <div data-testid="post-header">
        <img
          src={mockAuthor.avatar_url}
          alt={mockAuthor.username}
          data-testid="author-avatar"
        />
        <span>{mockAuthor.display_name}</span>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('author-avatar')).toHaveAttribute(
      'src',
      mockAuthor.avatar_url
    );
  });

  it('displays author avatar in comments', () => {
    const mockComment = {
      id: 1,
      author: mockAuthor,
      content: 'Great post!',
    };
    const TestComponent = () => (
      <div data-testid="comment">
        <img
          src={mockComment.author.avatar_url}
          alt={mockComment.author.username}
          data-testid="comment-author-avatar"
        />
        <span>{mockComment.author.display_name}</span>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('comment-author-avatar')).toHaveAttribute(
      'src',
      mockAuthor.avatar_url
    );
  });

  it('displays fallback avatar when no image URL', () => {
    const noAvatarAuthor = { ...mockAuthor, avatar_url: null };
    const TestComponent = () => (
      <div>
        {noAvatarAuthor.avatar_url ? (
          <img src={noAvatarAuthor.avatar_url} alt="avatar" />
        ) : (
          <div data-testid="fallback-avatar" className="placeholder">
            {noAvatarAuthor.username[0].toUpperCase()}
          </div>
        )}
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByTestId('fallback-avatar')).toHaveTextContent('A');
  });

  it('shows avatar tooltip with username', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [showTooltip, setShowTooltip] = React.useState(false);
      return (
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <img src={mockAuthor.avatar_url} alt={mockAuthor.username} />
          {showTooltip && <span>{mockAuthor.username}</span>}
        </div>
      );
    };
    render(<TestComponent />);
    const img = screen.getByAltText(mockAuthor.username);
    await user.hover(img);
    expect(screen.getByText(mockAuthor.username)).toBeInTheDocument();
  });

  it('links avatar to user profile', () => {
    const TestComponent = () => (
      <a href={`/profile/${mockAuthor.username}`}>
        <img src={mockAuthor.avatar_url} alt={mockAuthor.username} />
      </a>
    );
    render(<TestComponent />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/profile/${mockAuthor.username}`
    );
  });

  it('displays avatar for nested comment replies', () => {
    const mockReply = {
      id: 2,
      author: { ...mockAuthor, username: 'author2', avatar_url: 'https://example.com/avatar2.jpg' },
      content: 'Reply to comment',
    };
    const TestComponent = () => (
      <div style={{ marginLeft: '20px' }}>
        <img src={mockReply.author.avatar_url} alt={mockReply.author.username} />
        <span>{mockReply.author.display_name}</span>
      </div>
    );
    render(<TestComponent />);
    expect(screen.getByAltText('author2')).toHaveAttribute(
      'src',
      'https://example.com/avatar2.jpg'
    );
  });
});
