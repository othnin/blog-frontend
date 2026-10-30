import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryDropdown from '@/components/layout/CategoryDropdown';

jest.mock('next/link', () => {
  function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return MockLink;
});

const CATEGORIES = [
  { id: 1, name: 'Technology', slug: 'technology' },
  { id: 2, name: 'Science', slug: 'science' },
];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: async () => CATEGORIES })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CategoryDropdown', () => {
  it('loads categories from the public API', async () => {
    expect.assertions(3);
    render(<CategoryDropdown />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/blog/categories'));

    await userEvent.click(screen.getByRole('button', { name: /category/i }));

    expect(await screen.findByRole('menuitem', { name: 'Technology' })).toHaveAttribute(
      'href',
      '/blog/posts?category=technology'
    );
    expect(screen.getByRole('menuitem', { name: 'Science' })).toHaveAttribute(
      'href',
      '/blog/posts?category=science'
    );
  });
});
