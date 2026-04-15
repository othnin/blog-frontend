import { Suspense } from 'react';
import BlogPostsContent from './blog-posts-content';

export const dynamic = 'force-dynamic';

const LoadingFallback = () => (
  <div className="container mx-auto px-4 py-8">
    <p className="text-muted-foreground">Loading posts...</p>
  </div>
);

export default function BlogPostsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BlogPostsContent />
    </Suspense>
  );
}
