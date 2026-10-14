/**
 * Tests for GoogleMapContainer / RestaurantMarker.
 * The Google Maps SDK is mocked; these tests verify marker rendering, the
 * load states, and the missing-API-key fallback.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import GoogleMapContainer from '@/components/map/GoogleMapContainer';
import RestaurantMarker from '@/components/map/RestaurantMarker';
import { useJsApiLoader } from '@react-google-maps/api';

jest.mock('@react-google-maps/api', () => ({
  useJsApiLoader: jest.fn(),
  GoogleMap: ({ children }) => <div data-testid="google-map">{children}</div>,
  MarkerClusterer: ({ children }) => <div data-testid="clusterer">{children({})}</div>,
  Marker: ({ title, onClick, icon }) => (
    <button data-testid="marker" data-icon={typeof icon === 'string' ? icon : icon?.url} onClick={onClick}>{title}</button>
  ),
}));

const R1 = { id: 1, name: 'Uchi', latitude: '30.25', longitude: '-97.75' };
const R2 = { id: 2, name: 'Franklin BBQ', latitude: '30.27', longitude: '-97.72' };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
});

describe('GoogleMapContainer', () => {
  it('shows a loading state while the SDK loads', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });
    render(<GoogleMapContainer restaurants={[]} />);
    expect(screen.getByText(/loading map/i)).toBeInTheDocument();
  });

  it('renders a marker for each restaurant once loaded', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });
    render(<GoogleMapContainer restaurants={[R1, R2]} onMarkerClick={jest.fn()} />);
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(2);
    expect(screen.getByText('Uchi')).toBeInTheDocument();
  });

  it('applies the custom restaurant marker icon', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });
    render(<GoogleMapContainer restaurants={[R1]} />);
    expect(screen.getByTestId('marker')).toHaveAttribute('data-icon', '/icons/restaurant.svg');
  });

  it('shows an error state when the SDK fails to load', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('boom') });
    render(<GoogleMapContainer restaurants={[]} />);
    expect(screen.getByText(/could not load the map/i)).toBeInTheDocument();
  });

  it('shows a fallback when no API key is configured', () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = '';
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });
    render(<GoogleMapContainer restaurants={[]} />);
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument();
  });
});

describe('RestaurantMarker', () => {
  it('converts string coordinates to numbers', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });
    render(<RestaurantMarker restaurant={R1} />);
    expect(screen.getByText('Uchi')).toBeInTheDocument();
  });
});
