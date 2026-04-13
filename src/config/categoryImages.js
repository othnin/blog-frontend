/**
 * Maps category slugs to their static image paths (served from /public/categories/).
 * Replace the SVG files with real photos using the same filenames.
 */
export const CATEGORY_IMAGES = {
  'food-cooking': '/categories/food-cooking.webp',
  'technology':   '/categories/techn1.png',
  'science':      '/categories/science.jpg',
  'politics':     '/categories/politics1.webp',
  'philosophy':   '/categories/philosophy.jpg',
};

/**
 * Returns the best image URL for a category.
 * Prefers admin-uploaded image_url (served by Django), falls back to static map.
 * @param {string} slug
 * @param {string|null} [imageUrl] - image_url from the API response
 * @returns {string|null}
 */
export function getCategoryImage(slug, imageUrl) {
  if (imageUrl) return imageUrl;
  return CATEGORY_IMAGES[slug] ?? null;
}
