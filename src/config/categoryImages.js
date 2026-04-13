/**
 * Maps category slugs to their static image paths (served from /public/categories/).
 * Replace the SVG files with real photos using the same filenames.
 */
export const CATEGORY_IMAGES = {
  'food-cooking': '/categories/food-cooking.webp',
  'technology':   '/categories/technology.svg',
  'science':      '/categories/science.svg',
  'politics':     '/categories/politics.svg',
  'philosophy':   '/categories/philosophy.svg',
};

/**
 * Returns the image path for a given category slug, or null if not found.
 * @param {string} slug
 * @returns {string|null}
 */
export function getCategoryImage(slug) {
  return CATEGORY_IMAGES[slug] ?? null;
}
