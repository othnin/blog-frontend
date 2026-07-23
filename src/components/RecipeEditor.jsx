'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';
import TagSelector from '@/components/TagSelector';
import LexicalEditor from '@/components/LexicalEditor';
import { GripVertical, Trash2, Plus, ArrowUp, ArrowDown, X } from 'lucide-react';

const CUISINE_OPTIONS = [
  { value: '', label: 'None' },
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
  { value: '', label: 'None' },
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

function emptyIngredient() {
  return { _key: Math.random(), amount: '', unit: '', name: '', notes: '' };
}

function emptyInstruction() {
  return { _key: Math.random(), title: '', content: '' };
}

/**
 * RecipeEditor — structured form for creating / editing recipes.
 *
 * Props:
 *   initialData   object | null   Pre-populated data for edit mode
 *   onSubmit      async (payload) => void   Called with the serializable payload
 *   submitting    boolean
 *   error         string | null
 */
export default function RecipeEditor({ initialData = null, onSubmit, submitting, error }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'draft');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [images, setImages] = useState(initialData?.images ?? []);
  const [prepTime, setPrepTime] = useState(initialData?.prep_time_minutes ?? '');
  const [cookTime, setCookTime] = useState(initialData?.cook_time_minutes ?? '');
  const [yieldAmount, setYieldAmount] = useState(initialData?.yield_amount ?? '');
  const [yieldUnit, setYieldUnit] = useState(initialData?.yield_unit ?? '');
  const [cuisineType, setCuisineType] = useState(initialData?.cuisine_type ?? '');
  const [course, setCourse] = useState(initialData?.course ?? '');
  const [dietaryIds, setDietaryIds] = useState(
    initialData?.dietary_labels?.map((d) => d.id) ?? []
  );
  const [tagIds, setTagIds] = useState(initialData?.tags?.map((t) => t.id) ?? []);
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length
      ? initialData.ingredients.map((i) => ({ ...i, _key: Math.random() }))
      : [emptyIngredient()]
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions?.length
      ? initialData.instructions.map((i) => ({ ...i, _key: Math.random() }))
      : [emptyInstruction()]
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [commentsDisabled, setCommentsDisabled] = useState(initialData?.comments_disabled ?? false);

  const [dietaryLabels, setDietaryLabels] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

  useEffect(() => {
    fetch(API_ENDPOINTS.recipes.dietaryLabels)
      .then((r) => r.json())
      .then(setDietaryLabels)
      .catch(() => {});
  }, []);

  // ── Images ──────────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetchWithAuth(API_ENDPOINTS.blog.uploadImage, { method: 'POST', body: fd });
      if (!res.ok) { setImageError('Upload failed'); return; }
      const data = await res.json();
      setImages((prev) => [...prev, data.url]);
    } catch {
      setImageError('Upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const moveImageLeft = (idx) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };
  const moveImageRight = (idx) => {
    setImages((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  // ── Ingredients ─────────────────────────────────────────────────────────
  const updateIngredient = (idx, field, value) => {
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };
  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);
  const removeIngredient = (idx) => setIngredients((prev) => prev.filter((_, i) => i !== idx));
  const moveIngredient = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= ingredients.length) return;
    setIngredients((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  // ── Instructions ────────────────────────────────────────────────────────
  const updateInstruction = (idx, field, value) => {
    setInstructions((prev) => prev.map((ins, i) => i === idx ? { ...ins, [field]: value } : ins));
  };
  const addInstruction = () => setInstructions((prev) => [...prev, emptyInstruction()]);
  const removeInstruction = (idx) => setInstructions((prev) => prev.filter((_, i) => i !== idx));
  const moveInstruction = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= instructions.length) return;
    setInstructions((prev) => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      status,
      description: description.trim(),
      images,
      prep_time_minutes: prepTime === '' ? null : parseInt(prepTime),
      cook_time_minutes: cookTime === '' ? null : parseInt(cookTime),
      yield_amount: yieldAmount === '' ? null : parseFloat(yieldAmount),
      yield_unit: yieldUnit.trim(),
      cuisine_type: cuisineType,
      course,
      dietary_label_ids: dietaryIds,
      tag_ids: tagIds,
      ingredients: ingredients
        .filter((ing) => ing.name.trim())
        .map((ing, i) => ({
          order: i,
          amount: parseFloat(ing.amount) || 0,
          unit: ing.unit.trim(),
          name: ing.name.trim(),
          notes: ing.notes.trim(),
        })),
      instructions: instructions
        .filter((ins) => ins.content.trim())
        .map((ins, i) => ({
          step_number: i + 1,
          title: ins.title.trim(),
          content: ins.content.trim(),
        })),
      notes: notes.trim(),
      comments_disabled: commentsDisabled,
    };
    onSubmit(payload);
  };

  const inputCls = 'w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground';
  const labelCls = 'block text-sm font-medium mb-1 text-foreground';
  const sectionCls = 'bg-card border border-border rounded-lg p-5 space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Basic Info ─────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Basic Info</h2>

        <div>
          <label className={labelCls}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <LexicalEditor initialValue={description} onChange={setDescription} />
        </div>
      </div>

      {/* ── Images ─────────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Images</h2>
        <p className="text-xs text-muted-foreground">First image is the hero. Drag-free reorder with arrows.</p>

        {imageError && <p className="text-sm text-red-500">{imageError}</p>}

        <div className="flex flex-wrap gap-3">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative w-28 h-28 rounded-md overflow-hidden border border-border group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  Hero
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImageLeft(idx)}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 text-white disabled:opacity-30"
                  disabled={idx === 0}
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImageRight(idx)}
                  className="p-1 rounded bg-white/20 hover:bg-white/40 text-white disabled:opacity-30"
                  disabled={idx === images.length - 1}
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1 rounded bg-red-500/80 hover:bg-red-500 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm cursor-pointer hover:bg-accent transition-colors">
          <Plus className="w-4 h-4" />
          {uploadingImage ? 'Uploading…' : 'Add Image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploadingImage}
          />
        </label>
      </div>

      {/* ── Timing & Yield ─────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Timing &amp; Yield</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Prep (min)</label>
            <input
              type="number" min="0" value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Cook (min)</label>
            <input
              type="number" min="0" value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Yield amount</label>
            <input
              type="number" min="0" step="any" value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              placeholder="4"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Yield unit</label>
            <input
              type="text" value={yieldUnit}
              onChange={(e) => setYieldUnit(e.target.value)}
              placeholder="servings"
              className={inputCls}
            />
          </div>
        </div>
        {totalTime > 0 && (
          <p className="text-sm text-muted-foreground">Total time: <span className="font-medium text-foreground">{totalTime} min</span></p>
        )}
      </div>

      {/* ── Classification ─────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Classification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cuisine</label>
            <select value={cuisineType} onChange={(e) => setCuisineType(e.target.value)} className={inputCls}>
              {CUISINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls}>
              {COURSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {dietaryLabels.length > 0 && (
          <div>
            <label className={labelCls}>Dietary Labels</label>
            <div className="flex flex-wrap gap-2">
              {dietaryLabels.map((d) => {
                const active = dietaryIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDietaryIds((prev) =>
                      active ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                    )}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
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
          </div>
        )}

        <div>
          <label className={labelCls}>Tags</label>
          <TagSelector selectedIds={tagIds} onChange={setTagIds} />
        </div>
      </div>

      {/* ── Ingredients ────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Ingredients</h2>

        <div className="space-y-2">
          {ingredients.map((ing, idx) => (
            <div key={ing._key} className="flex gap-2 items-center">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveIngredient(idx, -1)} disabled={idx === 0}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => moveIngredient(idx, 1)} disabled={idx === ingredients.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <input
                type="number" min="0" step="any"
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                placeholder="Amt"
                className="w-16 px-2 py-1.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                placeholder="Unit"
                className="w-20 px-2 py-1.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                placeholder="Ingredient name *"
                className="flex-1 px-2 py-1.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <input
                type="text"
                value={ing.notes}
                onChange={(e) => updateIngredient(idx, 'notes', e.target.value)}
                placeholder="Notes (optional)"
                className="w-32 px-2 py-1.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                disabled={ingredients.length === 1}
                className="p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Ingredient
        </button>
      </div>

      {/* ── Instructions ───────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Instructions</h2>

        <div className="space-y-3">
          {instructions.map((ins, idx) => (
            <div key={ins._key} className="flex gap-3 items-start">
              <div className="flex flex-col items-center gap-0.5 pt-2">
                <span className="text-xs font-semibold text-muted-foreground w-5 text-center">{idx + 1}</span>
                <button type="button" onClick={() => moveInstruction(idx, -1)} disabled={idx === 0}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => moveInstruction(idx, 1)} disabled={idx === instructions.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={ins.title}
                  onChange={(e) => updateInstruction(idx, 'title', e.target.value)}
                  placeholder="Step title (optional)"
                  className={inputCls}
                />
                <LexicalEditor initialValue={ins.content} onChange={(json) => updateInstruction(idx, 'content', json)} />
              </div>
              <button
                type="button"
                onClick={() => removeInstruction(idx)}
                disabled={instructions.length === 1}
                className="pt-2 p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addInstruction}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Step
        </button>
      </div>

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      <div className={sectionCls}>
        <h2 className="text-base font-semibold text-foreground">Notes</h2>
        <LexicalEditor initialValue={notes} onChange={setNotes} />
      </div>

      {/* ── Disable Comments ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="comments_disabled"
          checked={commentsDisabled}
          onChange={(e) => setCommentsDisabled(e.target.checked)}
          className="w-4 h-4 rounded border-input accent-primary"
        />
        <label htmlFor="comments_disabled" className="text-sm font-medium text-foreground cursor-pointer">
          Disable comments on this recipe
        </label>
      </div>

      {/* ── Error & Submit ──────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">{error}</div>
      )}

      <div className="flex gap-3 pb-4">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {submitting ? 'Saving…' : 'Save Recipe'}
        </button>
      </div>
    </form>
  );
}
