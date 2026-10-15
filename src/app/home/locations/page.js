'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { michelinLabel } from '@/lib/michelin';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LocationForm from '@/components/locations/LocationForm';
import { MapPin } from 'lucide-react';

export default function LocationsDashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  const load = useCallback(async () => {
    try {
      const [listRes, meRes] = await Promise.all([
        fetchWithAuth(API_ENDPOINTS.locations.manage + '?type=restaurant'),
        fetchWithAuth(API_ENDPOINTS.auth.me),
      ]);
      if (!listRes.ok) throw new Error('Failed to load locations');
      setRestaurants(await listRes.json());
      if (meRes.ok) {
        const me = await meRes.json();
        setUserRole(me.profile?.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const handleDelete = async (restaurant) => {
    if (!confirm(`Delete "${restaurant.name}"? This cannot be undone.`)) return;
    setDeleting(restaurant.id);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.locations.restaurant(restaurant.id), {
        method: 'DELETE',
      });
      if (res.ok) setRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id));
      else setError('Failed to delete location');
    } catch {
      setError('Failed to delete location');
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (restaurant) => {
    setEditing(restaurant);
    setFormOpen(true);
  };

  const handleSaved = (saved) => {
    setRestaurants((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      return exists ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
    });
    setFormOpen(false);
    setEditing(null);
  };

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>;
  }

  const canManage = userRole === 'editor' || userRole === 'admin';

  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">You do not have permission to manage locations.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Restaurant Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {restaurants.length} location{restaurants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
        >
          + New Restaurant
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No restaurant locations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors"
            >
              <div className="flex gap-3 items-start flex-1 min-w-0">
                {restaurant.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={restaurant.picture_url}
                    alt=""
                    className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground line-clamp-1">{restaurant.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {restaurant.address}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400">
                      {michelinLabel(restaurant.michelin_rating)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        restaurant.is_published
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {restaurant.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <button
                  onClick={() => openEdit(restaurant)}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(restaurant)}
                  disabled={deleting === restaurant.id}
                  className="px-3 py-1 text-sm bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deleting === restaurant.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(next) => {
          if (!next) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Restaurant' : 'New Restaurant'}</DialogTitle>
          </DialogHeader>
          <LocationForm
            initial={editing}
            onSaved={handleSaved}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
