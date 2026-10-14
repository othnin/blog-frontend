'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import GoogleMapContainer from '@/components/map/GoogleMapContainer';
import RatingFilter from '@/components/map/RatingFilter';
import RestaurantModal from '@/components/map/RestaurantModal';

export default function MapPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchRestaurants = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (rating) params.set('rating', rating);

    fetch(`${API_ENDPOINTS.locations.restaurants}?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load restaurants');
        return r.json();
      })
      .then(setRestaurants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [rating]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Austin Restaurants</h1>
          {!loading && !error && (
            <p className="text-sm text-muted-foreground mt-1">
              {restaurants.length} location{restaurants.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <RatingFilter value={rating} onChange={setRating} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="w-full h-[70vh] rounded-lg border border-border overflow-hidden bg-card">
        <GoogleMapContainer restaurants={restaurants} onMarkerClick={setSelected} />
      </div>

      <RestaurantModal
        restaurant={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
