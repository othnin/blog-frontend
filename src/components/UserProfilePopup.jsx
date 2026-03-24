'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Twitter, Github, Globe, X } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

const ROLE_LABELS = { admin: 'Admin', editor: 'Editor', reader: 'Reader' };

/** Ensure a URL has a protocol so it's never treated as a relative path. */
function ensureAbsolute(url) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Extract a short handle/hostname for display from a URL. */
function extractHandle(url) {
  try {
    const abs = ensureAbsolute(url);
    const { hostname, pathname } = new URL(abs);
    // Last non-empty path segment (covers /username or /username/)
    const segment = pathname.replace(/\/$/, '').split('/').filter(Boolean).pop();
    return segment ? `@${segment}` : hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function useProfilePopup() {
  const [popup, setPopup] = useState(null); // { username, anchorRect }

  const open = (username, anchorRect) => setPopup({ username, anchorRect });
  const close = () => setPopup(null);

  return { popup, open, close };
}

export default function UserProfilePopup({ username, anchorRect, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    fetch(API_ENDPOINTS.auth.profile(username))
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  // Close on outside click or Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  // Position the popup near the anchor element
  const style = (() => {
    if (!anchorRect) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const POPUP_WIDTH = 280;
    const POPUP_HEIGHT = 240;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = anchorRect.left;
    let top = anchorRect.bottom + 8;

    if (left + POPUP_WIDTH > viewportW - 8) left = viewportW - POPUP_WIDTH - 8;
    if (left < 8) left = 8;
    if (top + POPUP_HEIGHT > viewportH - 8) top = anchorRect.top - POPUP_HEIGHT - 8;

    return { position: 'fixed', top, left, zIndex: 100 };
  })();

  if (loading) {
    return (
      <div ref={ref} style={style} className="w-70 bg-card border border-border rounded-lg shadow-xl p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (notFound) return null;

  return (
    <div ref={ref} style={style} className="w-70 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {profile.display_name || profile.username}
          </p>
          {profile.display_name && (
            <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
          )}
          {profile.role && profile.role !== 'reader' && (
            <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{profile.bio}</p>
        )}

        {(profile.twitter_url || profile.github_url || profile.website_url) && (
          <div className="flex flex-wrap gap-3">
            {profile.twitter_url && (
              <a href={ensureAbsolute(profile.twitter_url)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-3.5 w-3.5" />
                {extractHandle(profile.twitter_url)}
              </a>
            )}
            {profile.github_url && (
              <a href={ensureAbsolute(profile.github_url)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-3.5 w-3.5" />
                {extractHandle(profile.github_url)}
              </a>
            )}
            {profile.website_url && (
              <a href={ensureAbsolute(profile.website_url)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-3.5 w-3.5" />
                {extractHandle(profile.website_url)}
              </a>
            )}
          </div>
        )}

        {!profile.bio && !profile.twitter_url && !profile.github_url && !profile.website_url && (
          <p className="text-xs text-muted-foreground italic">No profile info yet.</p>
        )}
      </div>
    </div>
  );
}
