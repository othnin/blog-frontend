'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { MICHELIN_RATINGS } from '@/lib/michelin';

const EMPTY = {
  name: '',
  description: '',
  address: '',
  phone: '',
  website: '',
  latitude: '',
  longitude: '',
  cuisine_type: '',
  michelin_rating: 'none',
  reservations_link: '',
  review_link: '',
  is_published: true,
};

const inputCls =
  'w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground';
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

function toFormState(restaurant) {
  if (!restaurant) return { ...EMPTY };
  return {
    name: restaurant.name ?? '',
    description: restaurant.description ?? '',
    address: restaurant.address ?? '',
    phone: restaurant.phone ?? '',
    website: restaurant.website ?? '',
    latitude: restaurant.latitude ?? '',
    longitude: restaurant.longitude ?? '',
    cuisine_type: restaurant.cuisine_type ?? '',
    michelin_rating: restaurant.michelin_rating ?? 'none',
    reservations_link: restaurant.reservations_link ?? '',
    review_link: restaurant.review_link ?? '',
    is_published: restaurant.is_published ?? true,
  };
}

/**
 * LocationForm — create/edit form for a restaurant location.
 *
 * Geocoding runs on address blur via POST /api/locations/geocode/; the resolved
 * lat/lon populate hidden fields. A picture (if chosen) is uploaded to
 * /api/locations/{id}/picture/ after the record is saved.
 */
export default function LocationForm({ initial = null, onSaved, onCancel }) {
  const [form, setForm] = useState(toFormState(initial));
  const [picture, setPicture] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isEditing = Boolean(initial);

  const setField = (field) => (e) => {
    const value = field === 'is_published' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    if (form.latitude && form.longitude) return; // already resolved
    setGeocoding(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.locations.geocode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: form.address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Could not geocode this address.');
        return;
      }
      setForm((prev) => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
      setNotice(`Located at ${data.latitude}, ${data.longitude}`);
    } catch {
      setError('Could not geocode this address.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.latitude || !form.longitude) {
      setError('Address must be geocoded before saving. Blur the address field to resolve it.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        address: form.address.trim(),
        phone: form.phone,
        website: form.website || null,
        latitude: String(form.latitude),
        longitude: String(form.longitude),
        is_published: form.is_published,
        michelin_rating: form.michelin_rating,
        cuisine_type: form.cuisine_type,
        reservations_link: form.reservations_link || null,
        review_link: form.review_link || null,
      };

      const url = isEditing
        ? API_ENDPOINTS.locations.restaurant(initial.id)
        : API_ENDPOINTS.locations.restaurants;
      const res = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (!res.ok) {
        setError(saved.detail || 'Failed to save restaurant.');
        return;
      }

      let result = saved;
      if (picture) {
        const fd = new FormData();
        fd.append('file', picture);
        const picRes = await fetchWithAuth(API_ENDPOINTS.locations.picture(saved.id), {
          method: 'POST',
          body: fd,
        });
        if (picRes.ok) {
          result = await picRes.json();
        } else {
          const picData = await picRes.json();
          setError(picData.detail || 'Saved, but picture upload failed.');
        }
      }

      onSaved?.(result);
    } catch {
      setError('Failed to save restaurant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="p-2 bg-green-500/10 border border-green-500 text-green-600 rounded-md text-sm">
          {notice}
        </div>
      )}

      <div>
        <label className={labelCls} htmlFor="loc-name">Name</label>
        <input id="loc-name" className={inputCls} value={form.name} onChange={setField('name')} required maxLength={255} />
      </div>

      <div>
        <label className={labelCls} htmlFor="loc-description">Description</label>
        <textarea
          id="loc-description"
          className={inputCls}
          rows={3}
          value={form.description}
          onChange={setField('description')}
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="loc-address">Address</label>
        <input
          id="loc-address"
          className={inputCls}
          value={form.address}
          onChange={setField('address')}
          onBlur={handleGeocode}
          required
          maxLength={500}
        />
        {geocoding && <p className="text-xs text-muted-foreground mt-1">Locating…</p>}
        {form.latitude && form.longitude && !geocoding && (
          <p className="text-xs text-muted-foreground mt-1">
            {form.latitude}, {form.longitude}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="loc-phone">Phone</label>
          <input id="loc-phone" className={inputCls} value={form.phone} onChange={setField('phone')} maxLength={20} />
        </div>
        <div>
          <label className={labelCls} htmlFor="loc-cuisine">Cuisine</label>
          <input
            id="loc-cuisine"
            className={inputCls}
            value={form.cuisine_type}
            onChange={setField('cuisine_type')}
            maxLength={100}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="loc-rating">Michelin Rating</label>
          <select id="loc-rating" className={inputCls} value={form.michelin_rating} onChange={setField('michelin_rating')}>
            {MICHELIN_RATINGS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="loc-website">Website</label>
          <input id="loc-website" className={inputCls} value={form.website} onChange={setField('website')} maxLength={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="loc-reservations">Reservations Link</label>
          <input
            id="loc-reservations"
            className={inputCls}
            value={form.reservations_link}
            onChange={setField('reservations_link')}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="loc-review">Review Link</label>
          <input
            id="loc-review"
            className={inputCls}
            value={form.review_link}
            onChange={setField('review_link')}
            maxLength={200}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="loc-picture">Picture</label>
        <input
          id="loc-picture"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPicture(e.target.files?.[0] || null)}
          className="text-sm text-muted-foreground"
        />
        {initial?.picture_url && !picture && (
          <p className="text-xs text-muted-foreground mt-1">Current picture will be kept unless replaced.</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground" htmlFor="loc-published">
        <input id="loc-published" type="checkbox" checked={form.is_published} onChange={setField('is_published')} />
        Published (visible on the public map)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || geocoding}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Restaurant'}
        </button>
      </div>
    </form>
  );
}
