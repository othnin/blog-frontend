'use client';

import { Marker } from '@react-google-maps/api';

/**
 * RestaurantMarker — a single map marker for a restaurant location.
 * Coordinates come from the API as decimal strings; convert to numbers for
 * the Google Maps SDK.
 */
export default function RestaurantMarker({ restaurant, onClick, icon, clusterer }) {
  return (
    <Marker
      position={{
        lat: Number(restaurant.latitude),
        lng: Number(restaurant.longitude),
      }}
      title={restaurant.name}
      icon={icon}
      clusterer={clusterer}
      onClick={() => onClick?.(restaurant)}
    />
  );
}
