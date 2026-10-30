/**
 * Tests for LOC features (frontend): map browsing, rating filter, restaurant
 * modal, location create/edit form, and the home locations manager.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MapPage from '@/app/map/page';
import LocationsDashboardPage from '@/app/home/locations/page';
import LocationForm from '@/components/locations/LocationForm';
import RatingFilter from '@/components/map/RatingFilter';
import RestaurantModal from '@/components/map/RestaurantModal';
import { useRouter } from 'next/navigation';
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

jest.mock('@/lib/tokenUtils', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/components/CommentThread', () => {
  function MockCommentThread() {
    return <div data-testid="comment-thread">Comments</div>;
  }
  return MockCommentThread;
});

// Isolate the map page from the Google SDK; render markers as buttons.
jest.mock('@/components/map/GoogleMapContainer', () => {
  function MockMap({ restaurants, onMarkerClick }) {
    return (
      <div data-testid="map-container">
        {restaurants.map((r) => (
          <button key={r.id} onClick={() => onMarkerClick?.(r)}>
            {r.name}
          </button>
        ))}
      </div>
    );
  }
  return MockMap;
});

const mockUseAuth = jest.fn();
jest.mock('@/components/authProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Fixtures & helpers ───────────────────────────────────────────────────────

const R1 = {
  id: 1,
  name: 'Uchi',
  latitude: '30.2500',
  longitude: '-97.7500',
  address: '801 S Lamar Blvd',
  description: 'Modern Japanese',
  michelin_rating: 'one_star',
  cuisine_type: 'Japanese',
  phone: '512-555-1212',
  website: null,
  reservations_link: null,
  review_link: null,
  is_published: true,
  picture_url: null,
};
const R2 = { ...R1, id: 2, name: 'Franklin BBQ', michelin_rating: 'bib_gourmand' };

const ok = (data) => Promise.resolve({ ok: true, status: 200, json: async () => data });
const fail = (data = { detail: 'Error' }, status = 400) =>
  Promise.resolve({ ok: false, status, json: async () => data });

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  useRouter.mockReturnValue({ push: jest.fn(), replace: jest.fn() });
  mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
  global.confirm = jest.fn(() => true);
});

// ─── MapPage ──────────────────────────────────────────────────────────────────

describe('MapPage', () => {
  it('renders markers and a location count after fetching', async () => {
    global.fetch.mockResolvedValueOnce(ok([R1, R2]));
    render(<MapPage />);
    await waitFor(() => expect(screen.getByText('Uchi')).toBeInTheDocument());
    expect(screen.getByText('Franklin BBQ')).toBeInTheDocument();
    expect(screen.getByText(/2 locations/i)).toBeInTheDocument();
  });

  it('passes the selected rating to the API', async () => {
    global.fetch.mockResolvedValue(ok([]));
    render(<MapPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await userEvent.selectOptions(screen.getByLabelText(/michelin/i), 'two_star');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith('/api/restaurants/?rating=two_star')
    );
  });

  it('shows an error banner when the request fails', async () => {
    global.fetch.mockResolvedValueOnce(fail());
    render(<MapPage />);
    await waitFor(() =>
      expect(screen.getByText(/failed to load restaurants/i)).toBeInTheDocument()
    );
  });

  it('opens the restaurant modal when a marker is clicked', async () => {
    global.fetch.mockResolvedValueOnce(ok([R1]));
    render(<MapPage />);
    await waitFor(() => expect(screen.getByText('Uchi')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Uchi'));
    expect(screen.getByRole('heading', { name: 'Uchi' })).toBeInTheDocument();
  });
});

// ─── RatingFilter ─────────────────────────────────────────────────────────────

describe('RatingFilter', () => {
  it('lists all ratings including "All Ratings"', () => {
    render(<RatingFilter value="" onChange={jest.fn()} />);
    expect(screen.getByRole('option', { name: /all ratings/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /three stars/i })).toBeInTheDocument();
  });

  it('calls onChange with the selected value', async () => {
    const onChange = jest.fn();
    render(<RatingFilter value="" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText(/michelin/i), 'green_star');
    expect(onChange).toHaveBeenCalledWith('green_star');
  });
});

// ─── RestaurantModal ──────────────────────────────────────────────────────────

describe('RestaurantModal', () => {
  it('shows details on the Details tab', () => {
    render(<RestaurantModal restaurant={R1} open onClose={jest.fn()} />);
    expect(screen.getByText('Modern Japanese')).toBeInTheDocument();
    expect(screen.getByText('One Star')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '801 S Lamar Blvd' })).toBeInTheDocument();
  });

  it('renders the comment thread on the Reviews tab', async () => {
    render(<RestaurantModal restaurant={R1} open onClose={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /reviews/i }));
    expect(screen.getByTestId('comment-thread')).toBeInTheDocument();
  });

  it('renders nothing when no restaurant is selected', () => {
    const { container } = render(<RestaurantModal restaurant={null} open={false} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// ─── LocationForm ─────────────────────────────────────────────────────────────

describe('LocationForm', () => {
  it('geocodes the address on blur', async () => {
    fetchWithAuth.mockResolvedValueOnce(ok({ latitude: '30.1', longitude: '-97.1' }));
    render(<LocationForm onSaved={jest.fn()} onCancel={jest.fn()} />);
    const address = screen.getByLabelText(/address/i);
    await userEvent.type(address, '123 Main St');
    fireEvent.blur(address);
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/locations/geocode/',
        expect.objectContaining({ method: 'POST' })
      )
    );
    await waitFor(() => expect(screen.getByText(/located at 30.1, -97.1/i)).toBeInTheDocument());
  });

  it('blocks submit when the address has not been geocoded', async () => {
    fetchWithAuth.mockResolvedValueOnce(fail({ detail: 'nope' }));
    render(<LocationForm onSaved={jest.fn()} onCancel={jest.fn()} />);
    await userEvent.type(screen.getByLabelText(/^name$/i), 'My Cafe');
    const address = screen.getByLabelText(/address/i);
    await userEvent.type(address, 'Nowhere');
    fireEvent.blur(address);
    const form = screen.getByRole('button', { name: /create restaurant/i }).closest('form');
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText(/must be geocoded before saving/i)).toBeInTheDocument()
    );
  });

  it('creates a restaurant after geocoding', async () => {
    const onSaved = jest.fn();
    fetchWithAuth
      .mockResolvedValueOnce(ok({ latitude: '30.1', longitude: '-97.1' })) // geocode
      .mockResolvedValueOnce(ok({ ...R1, id: 9, name: 'My Cafe' }));        // create
    render(<LocationForm onSaved={onSaved} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText(/^name$/i), 'My Cafe');
    const address = screen.getByLabelText(/address/i);
    await userEvent.type(address, '123 Main St');
    fireEvent.blur(address);
    await waitFor(() => expect(screen.getByText(/located at 30.1, -97.1/i)).toBeInTheDocument());

    const form = screen.getByRole('button', { name: /create restaurant/i }).closest('form');
    fireEvent.submit(form);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 9 })));

    const [url, options] = fetchWithAuth.mock.calls[1];
    expect(url).toBe('/api/restaurants/');
    expect(options.method).toBe('POST');
  });

  it('updates an existing restaurant via PUT', async () => {
    const onSaved = jest.fn();
    fetchWithAuth.mockResolvedValueOnce(ok({ ...R1, name: 'Uchi Updated' }));
    render(<LocationForm initial={R1} onSaved={onSaved} onCancel={jest.fn()} />);
    const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
    fireEvent.submit(form);
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [url, options] = fetchWithAuth.mock.calls[0];
    expect(url).toBe('/api/restaurants/1/');
    expect(options.method).toBe('PUT');
  });

  it('renders a Ninja validation array as text when a picture upload fails', async () => {
    fetchWithAuth
      .mockResolvedValueOnce(ok({ ...R1 })) // update restaurant
      .mockResolvedValueOnce(
        fail({ detail: [{ type: 'missing', loc: ['file', 'file'], msg: 'Field required' }] }, 422)
      ); // picture upload

    render(<LocationForm initial={R1} onSaved={jest.fn()} onCancel={jest.fn()} />);

    const picture = new File(['not really a png'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/picture/i), { target: { files: [picture] } });

    const form = screen.getByRole('button', { name: /save changes/i }).closest('form');
    fireEvent.submit(form);

    // Must not throw React #31 ("Objects are not valid as a React child").
    await waitFor(() => expect(screen.getByText(/file: Field required/i)).toBeInTheDocument());
  });
});

// ─── Dashboard locations page ─────────────────────────────────────────────────

describe('LocationsDashboardPage', () => {
  it('shows a permission message for readers', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockImplementation((url) => {
      if (url.startsWith('/api/locations/manage')) return ok([]);
      if (url === '/api/auth/me') return ok({ profile: { role: 'reader' } });
      return ok({});
    });
    render(<LocationsDashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument()
    );
  });

  it('lists locations for editors and deletes on confirm', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchWithAuth.mockImplementation((url, options) => {
      if (url.startsWith('/api/locations/manage')) return ok([R1, R2]);
      if (url === '/api/auth/me') return ok({ profile: { role: 'editor' } });
      if (options?.method === 'DELETE') return ok({ message: 'ok' });
      return ok({});
    });
    render(<LocationsDashboardPage />);
    await waitFor(() => expect(screen.getByText('Uchi')).toBeInTheDocument());
    expect(screen.getByText('Franklin BBQ')).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    await waitFor(() => expect(screen.queryByText('Uchi')).not.toBeInTheDocument());
    expect(global.confirm).toHaveBeenCalled();
  });

  it('redirects to login when unauthenticated', async () => {
    const push = jest.fn();
    useRouter.mockReturnValue({ push, replace: jest.fn() });
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    render(<LocationsDashboardPage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  });
});
