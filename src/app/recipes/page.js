'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/authProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { fetchWithAuth } from '@/lib/tokenUtils';
import RecipeCard from '@/components/RecipeCard';
import { ChefHat, Search, X } from 'lucide-react';

const CUISINE_OPTIONS = [
  { value: '', label: 'All Cuisines' },
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'french', label: 'French' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'greek', label: 'Greek' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'korean', label: 'Korean' },
  { value: 'other', label: 'Other' },
];

const COURSE_OPTIONS = [
  { value: '', label: 'All Courses' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'snack', label: 'Snack' },
  { value: 'drink', label: 'Drink' },
  { value: 'sauce', label: 'Sauce/Condiment' },
  { value: 'side', label: 'Side Dish' },
  { value: 'soup', label: 'Soup' },
  { value: 'salad', label: 'Salad' },
];

function RecipeListContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recipes, setRecipes] = useState([]);
  const [dietaryLabels, setDietaryLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') ?? '');
  const [course, setCourse] = useState(searchParams.get('course') ?? '');
  const [selectedDietary, setSelectedDietary] = useState(
    searchParams.get('dietary') ? searchParams.get('dietary').split(',') : []
  );

  useEffect(() => {
    fetch(API_ENDPOINTS.recipes.dietaryLabels)
      .then((r) => r.json())
      .then(setDietaryLabels)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWithAuth(API_ENDPOINTS.auth.me)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUserRole(d.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated]);

  const fetchRecipes = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cuisine) params.set('cuisine', cuisine);
    if (course) params.set('course', course);
    if (selectedDietary.length) params.set('dietary', selectedDietary.join(','));

    fetch(`${API_ENDPOINTS.recipes.list}?${params}`)
      .then((r) => { if (!r.ok) throw new Error('Failed to load recipes'); return r.json(); })
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, cuisine, course, selectedDietary]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const clearFilters = () => {
    setSearch('');
    setCuisine('');
    setCourse('');
    setSelectedDietary([]);
  };

  const hasFilters = search || cuisine || course || selectedDietary.length > 0;
  const selectCls = 'px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recipes</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {(userRole === 'editor' || userRole === 'admin') && (
          <Link
            href="/dashboard/create-recipe"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
          >
            + New Recipe
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Cuisine + Course */}
        <div className="flex flex-wrap gap-2">
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={selectCls}>
            {CUISINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={course} onChange={(e) => setCourse(e.target.value)} className={selectCls}>
            {COURSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Dietary pills */}
        {dietaryLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dietaryLabels.map((d) => {
              const active = selectedDietary.includes(String(d.id));
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDietary((prev) =>
                    active ? prev.filter((x) => x !== String(d.id)) : [...prev, String(d.id)]
                  )}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-background text-foreground border-input hover:bg-accent'
                  }`}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border rounded-lg bg-card animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ChefHat className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="text-base">No recipes found.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-sm text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading…</p></div>}>
      <RecipeListContent />
    </Suspense>
  );
}
