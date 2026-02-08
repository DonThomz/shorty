import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders initial state with title and form', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /shorty/i })).toBeInTheDocument();
    expect(screen.getByText(/shorten your urls instantly/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/example\.com/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten/i })).toBeInTheDocument();
  });

  it('displays ShortUrlResult after successful shorten', async () => {
    const mockShortUrl = 'http://localhost:3000/abc1234';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ shortUrl: mockShortUrl }),
      })
    );

    render(<App />);

    const input = screen.getByLabelText(/url to shorten/i);
    await userEvent.type(input, 'https://example.com');
    await userEvent.click(screen.getByRole('button', { name: /shorten/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: mockShortUrl })).toBeInTheDocument();
    });
    expect(screen.getByText(/your short url/i)).toBeInTheDocument();
  });
});
