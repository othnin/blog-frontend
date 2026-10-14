'use client';

import { GoogleMap, MarkerClusterer, useJsApiLoader } from '@react-google-maps/api';
import RestaurantMarker from '@/components/map/RestaurantMarker';

const AUSTIN_CENTER = { lat: 30.2672, lng: -97.7431 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const MARKER_ICON_URL = '/icons/restaurant.svg';

function getMarkerIcon() {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return {
      url: MARKER_ICON_URL,
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 30),
    };
  }
  return MARKER_ICON_URL;
}

/**
 * GoogleMapContainer — loads the Google Maps JavaScript SDK, renders a map
 * centered on Austin, and plots restaurant markers with clustering.
 *
 * If NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or the SDK fails to load, an
 * inline error banner is shown instead of an empty/blank map.
 */
export default function GoogleMapContainer({ restaurants = [], onMarkerClick }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'locations-map',
    googleMapsApiKey: apiKey || '',
  });

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="max-w-md text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Map unavailable</p>
          <p>
            Set <code className="text-foreground">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your
            environment to display the map.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="max-w-md text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Could not load the map</p>
          <p>Check that the Google Maps JavaScript API is enabled for your key.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={AUSTIN_CENTER}
      zoom={12}
      options={MAP_OPTIONS}
    >
      <MarkerClusterer>
        {(clusterer) => (
          <>
            {restaurants.map((restaurant) => (
              <RestaurantMarker
                key={restaurant.id}
                restaurant={restaurant}
                icon={getMarkerIcon()}
                clusterer={clusterer}
                onClick={onMarkerClick}
              />
            ))}
          </>
        )}
      </MarkerClusterer>
    </GoogleMap>
  );
}
