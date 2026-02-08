# Shorty - URL Shortener

A monolithic URL shortener application built with NestJS (backend) and React (frontend). Simple, secure, and designed for local development.

## Project Overview

Shorty accepts long URLs, generates unique 7-character Base62 short codes, stores the mapping in PostgreSQL, and redirects visitors to the original URL when they use the short link.

## Architecture

```
shorty/
├── backend/          # NestJS API + serves frontend build
│   ├── src/
│   │   ├── common/   # Shared services (validation, rate limit, etc.)
│   │   ├── prisma/   # Database client
│   │   ├── shorten/  # POST /api/shorten
│   │   └── redirect/ # GET /:shortCode
│   └── prisma/       # Schema and migrations
├── frontend/         # React SPA (Vite)
│   └── src/
└── package.json      # Root scripts
```

**Flow:**
- Frontend build is served as static files by NestJS
- API and redirect routes are handled by NestJS controllers
- Single deployment unit: build frontend, run backend

## Tech Stack

| Layer      | Technology        |
| ---------- | ----------------- |
| Backend    | NestJS, TypeScript |
| Database   | PostgreSQL, Prisma ORM |
| Frontend   | React, TypeScript, Vite |
| Security   | Helmet, validation, rate limiting |

## How to Run Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm

### 1. PostgreSQL Setup

Create a database:

```bash
createdb shorty
```

Or using psql:

```sql
CREATE DATABASE shorty;
```

### 2. Environment Variables

Copy the example into `backend/` (Prisma reads `.env` from the backend directory):

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shorty?schema=public"
PORT=3000
NODE_ENV=development
```

Adjust `USER` and `PASSWORD` to match your PostgreSQL credentials. With Homebrew PostgreSQL, the user is often your Mac username and no password is needed:

```
DATABASE_URL="postgresql://ton_user@localhost:5432/shorty?schema=public"
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Prisma Migration

```bash
pnpm db:migrate
```

Or manually:

```bash
cd backend && pnpm exec prisma migrate dev
```

### 5. Start the Application

**Development** (backend + frontend with hot reload):

```bash
pnpm dev
```

Open http://localhost:5173 (frontend proxies API calls to backend on port 3000).

**Production** (built frontend served by backend):

```bash
pnpm build
pnpm start
```

Open http://localhost:3000.

## Outils de développement

Le projet utilise plusieurs outils pour maintenir la qualité du code et des commits.

### ESLint

Linting configuré pour le backend (NestJS/TypeScript) et le frontend (React/TypeScript), avec les règles recommandées, `eslint-config-prettier` pour éviter les conflits avec Prettier, et les plugins React/React Hooks.

```bash
pnpm lint          # Vérifier le code
pnpm lint:fix      # Corriger automatiquement les problèmes
```

### Prettier

Formatage du code selon `.prettierrc` (semicolons, single quotes, trailing commas ES5, etc.). Appliqué aux fichiers `.ts`, `.tsx`, `.css` et `.json`.

```bash
pnpm format        # Formater tous les fichiers
```

### Commitlint

Validation des messages de commit selon les [Conventional Commits](https://www.conventionalcommits.org/). Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

Exemple : `feat: add custom short codes`

### Husky + lint-staged

- **pre-commit** : exécute `lint-staged` avant chaque commit — ESLint (avec `--fix`) et Prettier sur les fichiers stagés (`.ts`, `.tsx`, `.css`, `.json`).
- **commit-msg** : exécute `commitlint` pour valider le message de commit.

Aucune action manuelle requise : les hooks s'exécutent automatiquement lors de `git commit`.

### Tests

Le projet dispose d'une suite de tests complète pour le backend (Jest) et le frontend (Vitest + React Testing Library).

```bash
pnpm test          # Exécute tous les tests (backend + frontend)
pnpm test:watch    # Mode watch, backend uniquement
```

**Backend (NestJS + Jest)**

- **Services :** `UrlValidatorService`, `ShortCodeService`, `ShortenService`, `RedirectService`
- **Controllers :** `ShortenController`, `RedirectController`
- **Guards et filtres :** `RateLimitGuard`, `HttpExceptionFilter`
- **Couverture :** validation des URLs (vide, longueur, protocoles interdits), génération de codes Base62, collisions, rate limit, gestion des erreurs

```bash
cd backend && pnpm test        # Exécution unique
cd backend && pnpm test:watch # Mode watch
```

**Frontend (React + Vitest)**

- **API :** `validateUrl`, `shortenUrl` (succès, erreurs 400/429, réseau)
- **Composants :** `ShortenForm`, `ShortUrlResult`, `App`
- **Couverture :** validation côté client, appel API, feedback copie, affichage des erreurs

```bash
cd frontend && pnpm test:run   # Exécution unique
cd frontend && pnpm test      # Mode watch
```

## API Endpoints

| Method | Path           | Description                    |
| ------ | ----------------- | ------------------------------ |
| POST   | /api/shorten      | Shorten a URL (rate limited)   |
| GET    | /:shortCode       | Redirect to original URL (302) |

### POST /api/shorten

**Request:**
```json
{ "url": "https://example.com/page" }
```

**Response (201):**
```json
{ "shortUrl": "http://localhost:3000/abc1234" }
```

**Errors:** 400 (validation), 429 (rate limit exceeded)

## Sécurité

### Éléments mis en place

#### 1. Validation des URLs

- **Protocoles autorisés :** uniquement `http://` et `https://`
- **Protocoles rejetés :** `javascript:`, `data:`, `file:`, `ftp:`, etc. (évite XSS, exécution de code, fuites de fichiers locaux)
- **Prévention des open redirects :** la whitelist de protocoles empêche les redirections vers des cibles malveillantes
- **Longueur max :** 2048 caractères pour limiter les abus
- **Implémentation :** `UrlValidatorService` + `class-validator` sur le DTO

#### 2. Sanitisation des entrées

- **Validation globale :** `ValidationPipe` NestJS avec `class-validator`
- **`whitelist: true`** — supprime les propriétés non déclarées dans le DTO
- **`forbidNonWhitelisted: true`** — rejette la requête si des propriétés inconnues sont envoyées (400)
- **`transform: true`** — cast automatique vers les types du DTO
- **DTO :** `ShortenDto` avec `@IsString`, `@IsNotEmpty`, `@MaxLength(2048)` sur `url`

#### 3. En-têtes HTTP de sécurité (Helmet)

- **X-Content-Type-Options:** `nosniff` — empêche le MIME sniffing
- **X-Frame-Options:** protection contre le clickjacking
- **X-XSS-Protection:** protection XSS du navigateur
- **Strict-Transport-Security** (HSTS) : imposition du HTTPS en production
- **Autres headers** : configuration Helmet par défaut pour la sécurité HTTP

#### 4. Gestion des erreurs

- **Filtre global :** `HttpExceptionFilter` appliqué à toute l’application
- **Messages exposés :** uniquement des messages génériques côté client
- **Pas de fuite :** pas de stack traces, détails internes ou infos sensibles
- **Erreurs non gérées :** loguées côté serveur, réponse client : "An unexpected error occurred"

#### 5. Codes HTTP cohérents

- **400** — validation échouée, URL invalide
- **404** — short code inexistant
- **429** — rate limit dépassé

### Rate limiting — configuration détaillée

Le rate limiting est appliqué via un **Guard NestJS** (`RateLimitGuard`) sur le contrôleur `POST /api/shorten`.

| Paramètre | Valeur | Description |
| --------- | ------ | ----------- |
| **Identifiant** | IP client | Une fenêtre par adresse IP |
| **Cible** | `POST /api/shorten` uniquement | Le endpoint de création de liens |
| **Fenêtre** | 60 secondes (1 minute) | Fenêtre glissante |
| **Limite** | 10 requêtes / fenêtre | Max 10 requêtes par IP par minute |
| **Algorithme** | Fenêtre glissante | Compteur remis à zéro quand la fenêtre expire |

**Comportement :**

- Première requête d’une IP : création d’une entrée `{ count: 1, resetAt: now + 60s }`
- Requêtes suivantes : incrément du compteur tant que `now < resetAt`
- Si `count >= 10` : HTTP **429** avec message `"Too many requests. Please try again later."`
- Si `now > resetAt` : fenêtre expirée → compteur remis à 1, nouvelle fenêtre

**Extraction de l’IP :**

- Derrière un proxy : utilisation de `X-Forwarded-For` (première IP = client)
- Sinon : `request.ip` ou `request.socket.remoteAddress`

**Stockage :** en mémoire (`Map<IP, { count, resetAt }>`). Les données sont perdues au redémarrage. Pour un déploiement multi-instances, remplacer par Redis (voir *Scalability Considerations*).

## Scalability Considerations (Not Implemented)

These are documented for future work; they are **not** implemented in the current codebase:

1. **Rate limiting:** Replace in-memory store with Redis for multi-instance deployments.
2. **Short code generation:** Consider distributed ID generation (e.g. Snowflake) to reduce collision risk at scale.
3. **Database:** Add read replicas for redirect traffic; use connection pooling (e.g. PgBouncer).
4. **Caching:** Cache short code → long URL lookups in Redis for high-traffic redirects.
5. **Horizontal scaling:** Run multiple NestJS instances behind a load balancer; ensure DB and rate limit store are shared.
6. **Monitoring:** Add metrics (latency, error rate) and structured logging for production observability.

## Possible Future Improvements

- Custom short codes (e.g. `/go/example`)
- Analytics (click counts, referrers)
- Expiration for short URLs
- Authentication for managing own links
- Admin UI for viewing/managing shortened URLs

## License

MIT
