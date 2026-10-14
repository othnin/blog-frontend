'use client';

/**
 * RecipeCommentThread — thin wrapper around the shared CommentThread using
 * recipe comment endpoints. Kept as a named component so recipe pages do not
 * need to know the endpoint shape.
 */
import CommentThread from '@/components/CommentThread';
import { API_ENDPOINTS } from '@/config/api';

export default function RecipeCommentThread({ recipeId, commentsDisabled = false }) {
  if (!recipeId) return null;

  return (
    <CommentThread
      commentsDisabled={commentsDisabled}
      commentsDisabledMessage="Comments are disabled on this recipe."
      endpoints={{
        list: API_ENDPOINTS.recipes.comments(recipeId),
        create: API_ENDPOINTS.recipes.comments(recipeId),
        update: API_ENDPOINTS.recipes.comment,
        delete: API_ENDPOINTS.recipes.comment,
      }}
    />
  );
}
