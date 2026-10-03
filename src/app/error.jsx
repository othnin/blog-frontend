'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root error boundary.
 *
 * Catches render-time failures in any page below the root layout and replaces
 * only the broken segment, so Navbar, Footer and the active theme survive -
 * unlike Next's default, which replaces the whole document and leaves a visitor
 * with no navigation at all.
 *
 * Must be a Client Component: it receives `error`/`reset` and owns a handler.
 *
 * A separate global-error.jsx covers failures in the root layout itself, where
 * this boundary is not in scope.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // `digest` is the only identifier that survives in production; it matches the
    // server-side log entry. `message` is scrubbed by Next in production builds.
    console.error('Unhandled UI error', {
      message: error?.message,
      digest: error?.digest,
    });
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>

        <p className="text-sm text-muted-foreground">
          An unexpected error interrupted this page. Trying again often fixes it.
        </p>

        {error?.digest && (
          <p className="text-xs text-muted-foreground">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}