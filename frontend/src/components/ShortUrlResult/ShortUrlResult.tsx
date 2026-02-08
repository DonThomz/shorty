import { useState } from 'react';
import './ShortUrlResult.css';

export interface ShortUrlResultProps {
  /** The generated short URL to display. */
  shortUrl: string;
}

/**
 * Displays the generated short URL with a copy-to-clipboard button.
 * Handles copy feedback internally.
 */
export function ShortUrlResult({ shortUrl }: ShortUrlResultProps) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = async () => {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      setCopyError('Failed to copy to clipboard');
    }
  };

  return (
    <div className="short-url-result">
      <label className="short-url-result__label">Your short URL:</label>
      <div className="short-url-result__row">
        <a
          href={shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="short-url-result__link"
        >
          {shortUrl}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="short-url-result__copy"
          disabled={copyFeedback}
        >
          {copyFeedback ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {copyError && (
        <div className="short-url-result__error" role="alert">
          {copyError}
        </div>
      )}
    </div>
  );
}
