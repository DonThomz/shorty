import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShortenForm } from './ShortenForm';

describe('ShortenForm', () => {
  it('validates empty URL on submit', async () => {
    const onSuccess = vi.fn();
    render(<ShortenForm onSuccess={onSuccess} />);

    const submitBtn = screen.getByRole('button', { name: /shorten/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('URL is required');
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('validates invalid URL format on submit', async () => {
    const onSuccess = vi.fn();
    render(<ShortenForm onSuccess={onSuccess} />);

    const input = screen.getByLabelText(/url to shorten/i);
    await userEvent.type(input, 'not-a-url');
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid URL format');
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('calls onSuccess with shortUrl on API success', async () => {
    const onSuccess = vi.fn();
    const mockShortUrl = 'http://localhost:3000/abc1234';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ shortUrl: mockShortUrl }),
      })
    );

    render(<ShortenForm onSuccess={onSuccess} />);

    const input = screen.getByLabelText(/url to shorten/i);
    await userEvent.type(input, 'https://example.com');
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockShortUrl);
    });
  });

  it('shows loading state while submitting', async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        fetchPromise.then(() => ({
          ok: true,
          json: vi.fn().mockResolvedValue({ shortUrl: 'http://localhost:3000/x' }),
        }))
      )
    );

    render(<ShortenForm onSuccess={vi.fn()} />);

    const input = screen.getByLabelText(/url to shorten/i);
    await userEvent.type(input, 'https://example.com');
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));

    expect(screen.getByRole('button', { name: /shortening/i })).toBeDisabled();

    resolveFetch!(undefined);
  });

  it('displays API error message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'URL is too long' }),
      })
    );

    render(<ShortenForm onSuccess={vi.fn()} />);

    const input = screen.getByLabelText(/url to shorten/i);
    await userEvent.type(input, 'https://example.com');
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('URL is too long');
    });
  });
});
