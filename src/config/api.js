// API configuration — use relative paths so Next.js proxy handles routing
export const API_ENDPOINTS = {
  auth: {
    login: '/api/token/pair',
    register: '/api/auth/register',
    me: '/api/auth/me',
    verifyEmail: '/api/auth/verify-email',
    passwordResetRequest: '/api/auth/password-reset-request',
    passwordResetConfirm: '/api/auth/password-reset-confirm',
    refreshToken: '/api/token/refresh',
    settings: '/api/auth/settings',
    avatar: '/api/auth/avatar',
    changePassword: '/api/auth/change-password',
    profile: (username) => `/api/auth/profile/${username}`,
  },
  blog: {
    posts: '/api/blog/posts',
    categories: '/api/blog/categories',
    myPosts: '/api/blog/my-posts',
    myPost: (id) => `/api/blog/my-posts/${id}`,
    uploadImage: '/api/blog/upload-image',
    comments: (postId) => `/api/blog/posts/${postId}/comments/`,
    comment: (commentId) => `/api/blog/comments/${commentId}/`,
    likePost: (slug) => `/api/blog/posts/${slug}/like/`,
    tags: '/api/blog/tags',
    tag: (id) => `/api/blog/tags/${id}`,
  },
};
