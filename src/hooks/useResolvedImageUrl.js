import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

/**
 * Hook that resolves a stored image key or URL to a fresh presigned URL.
 * If the input is already a full URL (http/https), passes through.
 * Otherwise, fetches a presigned URL from /api/blog/image-url.
 * Returns { src, loading } — src is the resolved URL or the original input.
 */
export function useResolvedImageUrl(keyOrUrl) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(!keyOrUrl);

  useEffect(() => {
    if (!keyOrUrl) {
      setSrc(null);
      setLoading(false);
      return;
    }

    const isFullUrl = keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://');
    if (isFullUrl) {
      setSrc(keyOrUrl);
      setLoading(false);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.blog.imageUrl}?filename=${encodeURIComponent(keyOrUrl)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSrc(data.url);
        } else {
          console.error('Failed to fetch signed URL:', response.statusText);
          setSrc(null);
        }
      } catch (err) {
        console.error('Failed to fetch signed image URL:', err);
        setSrc(null);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchSignedUrl();
  }, [keyOrUrl]);

  return { src, loading };
}
