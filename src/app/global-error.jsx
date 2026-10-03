'use client';

/**
 * Global error boundary - the last line of defence.
 *
 * This catches failures in the root layout itself, which is exactly the case
 * root error.jsx cannot handle (a boundary cannot catch an error in its own
 * parent). AuthProvider sits in the root layout and wraps the whole site, so a
 * throw there takes down every route at once; without this file that renders as
 * a blank document.
 *
 * Because the root layout is what failed, this component must render its own
 * <html> and <body>, and must not depend on Tailwind, next-themes or any import
 * from the layout - none of that can be trusted to have loaded. Everything here
 * is inline-styled so the document is valid and legible on its own.
 */
export default function GlobalError({ error, reset }) {
  if (typeof console !== 'undefined') {
    console.error('Root layout failure', {
      message: error?.message,
      digest: error?.digest,
    });
  }

  return (
    <html lang="en">
      <head>
        <title>Something went wrong</title>
        <style>{`
          :root {
            --ge-bg: #ffffff;
            --ge-fg: #0a0a0a;
            --ge-muted: #737373;
            --ge-border: #e5e5e5;
            --ge-btn-bg: #0a0a0a;
            --ge-btn-fg: #fafafa;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-bg: #0a0a0a;
              --ge-fg: #fafafa;
              --ge-muted: #a1a1a1;
              --ge-border: #262626;
              --ge-btn-bg: #fafafa;
              --ge-btn-fg: #0a0a0a;
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--ge-bg);
            color: var(--ge-fg);
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
              Roboto, Helvetica, Arial, sans-serif;
            padding: 2rem 1rem;
          }
          .ge-wrap {
            max-width: 28rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }
          .ge-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 3rem;
            height: 3rem;
            border-radius: 9999px;
            background: var(--ge-bg);
            border: 1px solid var(--ge-border);
          }
          .ge-h1 { font-size: 1.5rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
          .ge-p { font-size: 0.875rem; color: var(--ge-muted); margin: 0; line-height: 1.5; }
          .ge-code {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.75rem;
            color: var(--ge-muted);
          }
          .ge-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
          .ge-btn {
            display: inline-flex;
            align-items: center;
            height: 2.25rem;
            padding: 0 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            border: 1px solid transparent;
          }
          .ge-btn-primary { background: var(--ge-btn-bg); color: var(--ge-btn-fg); }
          .ge-btn-outline {
            background: transparent;
            color: var(--ge-fg);
            border-color: var(--ge-border);
          }
        `}</style>
      </head>
      <body>
        <div className="ge-wrap">
          <div className="ge-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ge-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1 className="ge-h1">Something went wrong</h1>

          <p className="ge-p">
            The site failed to load properly. This is our fault, not yours.
            Reloading the page usually resolves it.
          </p>

          {error?.digest && (
            <p className="ge-code">Reference: {error.digest}</p>
          )}

          <div className="ge-actions">
            <button type="button" className="ge-btn ge-btn-primary" onClick={reset}>
              Reload page
            </button>
            <a className="ge-btn ge-btn-outline" href="/">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}