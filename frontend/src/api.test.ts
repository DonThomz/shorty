import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateUrl, shortenUrl } from './api';

describe('validateUrl', () => {
  it('returns error for empty string', () => {
    expect(validateUrl('')).toBe('URL is required');
    expect(validateUrl('   ')).toBe('URL is required');
  });

  it('returns error for URL longer than 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2040);
    expect(validateUrl(longUrl)).toBe('URL is too long');
  });

  it('returns error for forbidden protocols', () => {
    expect(validateUrl('javascript:alert(1)')).toBe('Only http:// and https:// URLs are allowed');
    expect(validateUrl('data:text/html,<script>')).toBe(
      'Only http:// and https:// URLs are allowed'
    );
    expect(validateUrl('file:///etc/passwd')).toBe('Only http:// and https:// URLs are allowed');
    expect(validateUrl('ftp://example.com')).toBe('Only http:// and https:// URLs are allowed');
  });

  it('returns null for valid http URL', () => {
    expect(validateUrl('http://example.com')).toBeNull();
    expect(validateUrl('http://example.com/path')).toBeNull();
  });

  it('returns null for valid https URL', () => {
    expect(validateUrl('https://example.com')).toBeNull();
    expect(validateUrl('https://example.com/path?foo=bar')).toBeNull();
  });

  it('returns error for invalid URL format', () => {
    expect(validateUrl('not-a-url')).toBe('Invalid URL format');
    expect(validateUrl('http://')).toBe('Invalid URL format');
  });
});

describe('shortenUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns shortUrl on success', async () => {
    const mockJson = vi.fn().mockResolvedValue({ shortUrl: 'http://localhost:3000/abc1234' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: mockJson,
      })
    );

    const result = await shortenUrl('https://example.com');

    expect(result).toEqual({ shortUrl: 'http://localhost:3000/abc1234' });
    expect(fetch).toHaveBeenCalledWith('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
  });

  it('throws readable error on 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'URL is required' }),
      })
    );

    await expect(shortenUrl('')).rejects.toThrow('URL is required');
  });

  it('throws readable error on 429 (rate limit)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ message: 'Too many requests. Please try again later.' }),
      })
    );

    await expect(shortenUrl('https://example.com')).rejects.toThrow(
      'Too many requests. Please try again later.'
    );
  });

  it('falls back to generic message when 429 without message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({}),
      })
    );

    await expect(shortenUrl('https://example.com')).rejects.toThrow(
      'Too many requests. Please try again later.'
    );
  });

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(shortenUrl('https://example.com')).rejects.toThrow('Network error');
  });

  it('handles invalid JSON response gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      })
    );

    await expect(shortenUrl('https://example.com')).rejects.toThrow(
      'Failed to shorten URL. Please try again.'
    );
  });
});
