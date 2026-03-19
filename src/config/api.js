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
  },
  blog: {
    posts: '/api/blog/posts',
    categories: '/api/blog/categories',
    myPosts: '/api/blog/my-posts',
  },
};
