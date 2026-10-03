import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root 404 boundary.
 *
 * Rendered inside the root layout, so Navbar and Footer still apply - a
 * visitor who lands on a dead link can navigate away rather than being
 * stranded. Replaces Next's unstyled default, which matched neither the
 * light nor the dark theme.
 *
 * Any route can opt into a more specific message with its own not-found.jsx.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>

        <p className="text-sm font-medium text-muted-foreground">404</p>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          This page doesn&apos;t exist
        </h1>

        <p className="text-sm text-muted-foreground">
          The page you were looking for may have been moved, renamed, or deleted.
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/blog/posts/">Browse posts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}