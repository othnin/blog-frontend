// Michelin rating vocabulary shared by the map filter, marker modal, and the
// dashboard location form. Values must match the backend
// RestaurantLocation.MICHELIN_RATING_CHOICES.

export const MICHELIN_RATINGS = [
  { value: 'one_star', label: 'One Star' },
  { value: 'two_star', label: 'Two Stars' },
  { value: 'three_star', label: 'Three Stars' },
  { value: 'bib_gourmand', label: 'Bib Gourmand' },
  { value: 'selected', label: 'Selected' },
  { value: 'green_star', label: 'Green Star' },
  { value: 'none', label: 'None' },
];

export const MICHELIN_RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  ...MICHELIN_RATINGS,
];

export function michelinLabel(value) {
  const found = MICHELIN_RATINGS.find((r) => r.value === value);
  return found ? found.label : 'None';
}
