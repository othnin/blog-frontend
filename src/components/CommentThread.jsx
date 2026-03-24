'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/authProvider';
import { fetchWithAuth } from '@/lib/tokenUtils';
import { API_ENDPOINTS } from '@/config/api';
import LexicalRenderer from '@/components/LexicalRenderer';
import CommentEditor from '@/components/CommentEditor';
import { User } from 'lucide-react';
import UserProfilePopup from '@/components/UserProfilePopup';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CommentNode({
  comment,
  depth,
  postId,
  collapsed,
  toggleCollapse,
  replyingTo,
  setReplyingTo,
  editingId,
  setEditingId,
  submitting,
  handleReply,
  handleEdit,
  handleDelete,
  isAuthenticated,
  username,
  userRole,
  onUsernameClick,
}) {
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isCollapsed = collapsed[comment.id] ?? true;

  const canEdit =
    !comment.is_deleted && isAuthenticated && comment.author?.username === username;
  const canDelete =
    !comment.is_deleted &&
    isAuthenticated &&
    (comment.author?.username === username || userRole === 'admin');

  const authorAvatarUrl = !comment.is_deleted ? comment.author?.avatar_url : null;

  return (
    <div style={{ marginLeft: depth > 0 ? '1.25rem' : 0 }} className="mt-3">
      <div className="flex gap-2 items-start">
        {/* Expand/collapse toggle */}
        <div className="flex-shrink-0 w-5 mt-1">
          {hasReplies && (
            <button
              onClick={() => toggleCollapse(comment.id)}
              className="w-5 h-5 flex items-center justify-center text-xs border border-input rounded text-muted-foreground hover:bg-accent transition-colors"
              title={isCollapsed ? 'Show replies' : 'Hide replies'}
            >
              {isCollapsed ? '+' : '−'}
            </button>
          )}
        </div>

        {/* Author avatar */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center mt-0.5">
          {authorAvatarUrl ? (
            <img src={authorAvatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1">
            {comment.is_deleted ? (
              <span className="font-medium text-foreground">[deleted]</span>
            ) : (
              <button
                className="font-medium text-foreground hover:underline"
                onClick={(e) => onUsernameClick(comment.author?.username, e.currentTarget.getBoundingClientRect())}
              >
                {comment.author?.username}
              </button>
            )}
            <span>{formatDate(comment.created_at)}</span>
            {!comment.is_deleted && comment.updated_at !== comment.created_at && (
              <span className="italic">(edited)</span>
            )}
          </div>

          {/* Comment body */}
          {comment.is_deleted ? (
            <p className="text-muted-foreground italic text-sm">This comment was deleted.</p>
          ) : editingId === comment.id ? (
            <CommentEditor
              initialValue={comment.content_json}
              submitting={submitting}
              onSubmit={(json) => handleEdit(comment.id, json)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="text-sm">
              <LexicalRenderer jsonContent={comment.content_json} />
            </div>
          )}

          {/* Action row */}
          {!comment.is_deleted && editingId !== comment.id && (
            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setReplyingTo(comment.id);
                    setEditingId(null);
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Reply
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setReplyingTo(null);
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Inline reply editor */}
          {replyingTo === comment.id && (
            <div className="mt-2">
              <CommentEditor
                submitting={submitting}
                onSubmit={(json) => handleReply(comment.id, json)}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recursive children */}
      {!isCollapsed && hasReplies && (
        <div className="border-l border-border ml-2.5 pl-0">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingId={editingId}
              setEditingId={setEditingId}
              submitting={submitting}
              handleReply={handleReply}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              isAuthenticated={isAuthenticated}
              username={username}
              userRole={userRole}
              onUsernameClick={onUsernameClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ postId }) {
  const { isAuthenticated, username } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [collapsed, setCollapsed] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [topLevelOpen, setTopLevelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [userRole, setUserRole] = useState(null);
  const [profilePopup, setProfilePopup] = useState(null); // { username, anchorRect }

  const openProfilePopup = useCallback((uname, anchorRect) => {
    setProfilePopup({ username: uname, anchorRect });
  }, []);

  // Fetch user role for admin delete check
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(API_ENDPOINTS.auth.me)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUserRole(data.profile?.role); })
      .catch(() => {});
  }, [isAuthenticated]);

  const fetchComments = useCallback(() => {
    if (!postId) return;
    setError(null);
    fetch(API_ENDPOINTS.blog.comments(postId))
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load comments');
        return r.json();
      })
      .then((data) => setComments(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const toggleCollapse = useCallback((commentId) => {
    setCollapsed((prev) => ({ ...prev, [commentId]: !(prev[commentId] ?? true) }));
  }, []);

  const handleCreate = async (contentJson) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.comments(postId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json: contentJson }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.detail || 'Failed to post comment');
        return;
      }
      setTopLevelOpen(false);
      fetchComments();
    } catch {
      setSubmitError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId, contentJson) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.comments(postId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json: contentJson, parent_id: parentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.detail || 'Failed to post reply');
        return;
      }
      setReplyingTo(null);
      // Auto-expand the parent so the new reply is visible
      setCollapsed((prev) => ({ ...prev, [parentId]: false }));
      fetchComments();
    } catch {
      setSubmitError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId, contentJson) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.comment(commentId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_json: contentJson }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.detail || 'Failed to update comment');
        return;
      }
      setEditingId(null);
      fetchComments();
    } catch {
      setSubmitError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.blog.comment(commentId), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.detail || 'Failed to delete comment');
        return;
      }
      fetchComments();
    } catch {
      setSubmitError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const countComments = (nodes) => {
    let total = 0;
    for (const n of nodes) {
      if (!n.is_deleted) total += 1;
      if (n.replies?.length) total += countComments(n.replies);
    }
    return total;
  };

  const commentCount = countComments(comments);

  return (
    <div className="mt-2">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Comments {commentCount > 0 && <span className="text-muted-foreground text-base font-normal">({commentCount})</span>}
        </h2>
        {isAuthenticated && !topLevelOpen && (
          <button
            onClick={() => { setTopLevelOpen(true); setReplyingTo(null); setEditingId(null); }}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Comment
          </button>
        )}
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500 text-red-500 rounded-md text-sm">
          {submitError}
        </div>
      )}

      {/* Top-level comment editor */}
      {topLevelOpen && (
        <div className="mb-4">
          <CommentEditor
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setTopLevelOpen(false)}
          />
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading comments...</p>
      ) : (
        <>
          {error && comments.length === 0 && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          {!error && comments.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No comments yet.{isAuthenticated ? ' Be the first!' : ' Log in to comment.'}
            </p>
          )}
          {comments.length > 0 && (
        <div className="space-y-1 divide-y divide-border">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              postId={postId}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingId={editingId}
              setEditingId={setEditingId}
              submitting={submitting}
              handleReply={handleReply}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              isAuthenticated={isAuthenticated}
              username={username}
              userRole={userRole}
              onUsernameClick={openProfilePopup}
            />
          ))}
        </div>
          )}
        </>
      )}

      {/* Login prompt for guests */}
      {!isAuthenticated && (
        <p className="mt-4 text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Log in</a> to join the conversation.
        </p>
      )}

      {profilePopup && (
        <UserProfilePopup
          username={profilePopup.username}
          anchorRect={profilePopup.anchorRect}
          onClose={() => setProfilePopup(null)}
        />
      )}
    </div>
  );
}
