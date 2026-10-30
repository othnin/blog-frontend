import { getApiErrorMessage } from '@/lib/apiError';

describe('getApiErrorMessage', () => {
  it('returns a string detail as-is', () => {
    expect(getApiErrorMessage({ detail: 'Address is required.' }, 'fallback')).toBe(
      'Address is required.'
    );
  });

  it('formats Django Ninja validation arrays instead of returning objects', () => {
    const payload = {
      detail: [
        { type: 'missing', loc: ['file', 'file'], msg: 'Field required' },
        { type: 'string_too_long', loc: ['body', 'name'], msg: 'String should have at most 255 characters' },
      ],
    };

    expect(getApiErrorMessage(payload, 'fallback')).toBe(
      'file: Field required; name: String should have at most 255 characters'
    );
  });

  it('formats a top-level array of validation errors', () => {
    expect(
      getApiErrorMessage([{ type: 'missing', loc: ['body', 'file'], msg: 'Field required' }], 'fallback')
    ).toBe('file: Field required');
  });

  it('falls back for empty or unexpected payloads', () => {
    expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getApiErrorMessage({ detail: [] }, 'fallback')).toBe('fallback');
  });

  it('falls back to a message field', () => {
    expect(getApiErrorMessage({ message: 'Boom' }, 'fallback')).toBe('Boom');
  });
});
