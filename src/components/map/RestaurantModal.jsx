'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CommentThread from '@/components/CommentThread';
import { API_ENDPOINTS } from '@/config/api';
import { michelinLabel } from '@/lib/michelin';
import { MapPin, Phone, Globe, CalendarCheck, ExternalLink, UtensilsCrossed } from 'lucide-react';

function DetailsTab({ restaurant }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name}, ${restaurant.address}`
  )}`;

  return (
    <div className="space-y-4">
      {restaurant.picture_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={restaurant.picture_url}
          alt={restaurant.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      {restaurant.description && (
        <p className="text-sm text-foreground whitespace-pre-line">{restaurant.description}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <UtensilsCrossed className="w-4 h-4 flex-shrink-0" />
          <span className="text-foreground">{michelinLabel(restaurant.michelin_rating)}</span>
          {restaurant.cuisine_type && (
            <span className="ml-1">· {restaurant.cuisine_type}</span>
          )}
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {restaurant.address}
          </a>
        </div>

        {restaurant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">
              {restaurant.phone}
            </a>
          </div>
        )}

        {restaurant.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {restaurant.website}
            </a>
          </div>
        )}

        {restaurant.reservations_link && (
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a
              href={restaurant.reservations_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Make a reservation
            </a>
          </div>
        )}

        {restaurant.review_link && (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <a
              href={restaurant.review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Read our review
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsTab({ restaurant }) {
  return (
    <CommentThread
      endpoints={{
        list: API_ENDPOINTS.locations.comments(restaurant.id),
        create: API_ENDPOINTS.locations.comments(restaurant.id),
        update: API_ENDPOINTS.locations.comment,
        delete: API_ENDPOINTS.locations.comment,
      }}
    />
  );
}

/**
 * RestaurantModal — tabbed detail view for a selected restaurant.
 * Details tab shows location metadata; Reviews tab reuses the comment thread.
 */
export default function RestaurantModal({ restaurant, open, onClose }) {
  const [tab, setTab] = useState('details');

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{restaurant.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border">
          {[
            { id: 'details', label: 'Details' },
            { id: 'reviews', label: 'Reviews' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-2">
          {tab === 'details' ? (
            <DetailsTab restaurant={restaurant} />
          ) : (
            <ReviewsTab restaurant={restaurant} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
