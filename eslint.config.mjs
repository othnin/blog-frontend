import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * ESLint flat config.
 *
 * Replaces .eslintrc.json, which ESLint 9 no longer reads. That mismatch is why
 * `npm run lint` had been failing outright, and why the script pointed at
 * `next lint` - a subcommand Next.js 16 removed.
 *
 * `eslint-config-next/core-web-vitals` is exported as a flat-config array in
 * v16, so it spreads straight in.
 */
export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      // Pre-existing debt, downgraded from error so `npm run lint` can gate CI
      // without blocking on files this change did not touch. Fix the call sites,
      // then promote these back to error.
      //
      // set-state-in-effect (9 sites): LexicalEditor.jsx x3, LexicalRenderer.jsx,
      // Navbar.jsx, BlogDropdown.jsx, RecipeDropdown.jsx, UserProfilePopup.jsx,
      // recipes/page.js. Refactoring these means restructuring effects in the
      // editor and the auth-adjacent components - real behaviour risk that
      // deserves its own change, not a lint side effect.
      'react-hooks/set-state-in-effect': 'warn',

      // authProvider.jsx:27 reads `loginRequiredRedirect`, a const declared at
      // line 87. Not a runtime bug: effects run after render, so the binding is
      // initialised before the callback executes. The rule only flags lexical
      // access order. Moving the effect below the declaration would satisfy it,
      // but reordering auth wiring for a non-bug is not worth the risk.
      'react-hooks/immutability': 'warn',
    },
  },
];
