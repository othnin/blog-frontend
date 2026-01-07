'use client';

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4 text-foreground">Blog</h1>
      <p className="text-muted-foreground mb-8">
        Welcome to Monsters Eat Austin blog. Check back soon for exciting posts!
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Blog entries will go here */}
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-center text-muted-foreground">No blog posts yet</p>
        </div>
      </div>
    </div>
  );
}
