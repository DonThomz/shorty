import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortUrlResult } from './ShortUrlResult';

describe('ShortUrlResult', () => {
  const shortUrl = 'http://localhost:3000/abc1234';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays the short URL as a link', () => {
    render(<ShortUrlResult shortUrl={shortUrl} />);

    const link = screen.getByRole('link', { name: shortUrl });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', shortUrl);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows Copy button', () => {
    render(<ShortUrlResult shortUrl={shortUrl} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('shows "Copied!" feedback after copy', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<ShortUrlResult shortUrl={shortUrl} />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    await userEvent.click(copyBtn);

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shortUrl);
  });

  it('shows error when copy fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
      },
    });

    render(<ShortUrlResult shortUrl={shortUrl} />);

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    await userEvent.click(copyBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to copy to clipboard');
  });
});
