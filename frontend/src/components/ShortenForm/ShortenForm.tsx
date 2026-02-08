import { useState } from 'react';
import { shortenUrl, validateUrl } from '../../api';
import './ShortenForm.css';

export interface ShortenFormProps {
  /** Called when a short URL is successfully created. */
  onSuccess: (shortUrl: string) => void;
}

/**
 * Form component for shortening URLs.
 * Handles validation, API call, loading state, and error display.
 * Designed to be self-contained and reusable.
 */
export function ShortenForm({ onSuccess }: ShortenFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await shortenUrl(url);
      onSuccess(result.shortUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to shorten URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="shorten-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/your-long-url"
        disabled={loading}
        autoFocus
        aria-label="URL to shorten"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Shortening...' : 'Shorten'}
      </button>
      {error && (
        <div className="shorten-form__error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
