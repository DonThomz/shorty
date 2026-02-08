import { useState } from 'react';
import { ShortenForm, ShortUrlResult } from './components';
import './App.css';

/**
 * Main application component.
 * Composes ShortenForm and ShortUrlResult. Manages shortUrl state for result display.
 */
function App() {
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  return (
    <main className="card">
      <h1>Shorty</h1>
      <p className="subtitle">Shorten your URLs instantly</p>

      <ShortenForm onSuccess={setShortUrl} />

      {shortUrl && <ShortUrlResult shortUrl={shortUrl} />}
    </main>
  );
}

export default App;
