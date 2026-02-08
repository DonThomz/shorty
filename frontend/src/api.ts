/** Base path for API endpoints (proxied to backend in dev). */
const API_BASE = '/api';

/** Response shape from POST /api/shorten. */
export interface ShortenResponse {
  shortUrl: string;
}

/**
 * Validates a URL before sending to the API.
 * Mirrors backend rules: only http:// and https:// allowed.
 *
 * @param url - The URL string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return 'URL is required';
  if (trimmed.length > 2048) return 'URL is too long';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Only http:// and https:// URLs are allowed';
    }
    return null;
  } catch {
    return 'Invalid URL format';
  }
}

/**
 * Sends a long URL to the API and returns the generated short URL.
 *
 * @param longUrl - The URL to shorten (will be trimmed)
 * @returns Promise resolving to { shortUrl }
 * @throws Error with user-friendly message on failure (validation, rate limit, etc.)
 */
export async function shortenUrl(longUrl: string): Promise<ShortenResponse> {
  const response = await fetch(`${API_BASE}/shorten`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: longUrl.trim() }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.message ||
      (response.status === 429
        ? 'Too many requests. Please try again later.'
        : 'Failed to shorten URL. Please try again.');
    throw new Error(message);
  }

  return data;
}
