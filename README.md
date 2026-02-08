# Shorty - URL Shortener

A monolithic URL shortener application built with NestJS (backend) and React (frontend). Simple, secure, and designed for local development.

## Project Overview

Shorty takes long URLs, generates unique 7-character Base62 short codes, stores the mapping in PostgreSQL, and redirects visitors to the original URL when using the short link.

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
- The frontend build is served as static files by NestJS
- API and redirect routes are handled by NestJS controllers
- Single deployment unit: build the frontend, run the backend

### Architecture Choices

| Choice | Justification |
| ------ | ------------- |
| **Monolith** | Single deployment unit, simpler infrastructure and deployment. Ideal for MVP or low/medium-traffic apps. |
| **NestJS** | Modular structure, dependency injection, TypeScript typing. Mature ecosystem for REST APIs. |
| **Shared Services (`common/`)** | `UrlValidatorService`, `ShortCodeService`, and `RateLimitGuard` are reusable and independently testable. Clean separation of concerns. |
| **Base62 for short codes (7 chars)** | 62^7 ≈ 3.5 billion combinations. URL-friendly (a-z, A-Z, 0-9), no ambiguous characters. Random generation with collision retries. |
| **Prisma** | Type-safe ORM, versioned migrations, generated client. Simple, maintainable PostgreSQL connection. |
| **Frontend served by NestJS** | In production, no CORS issues since API and SPA share a domain. Only one server to deploy. |
| **In-memory rate limiting** | Sufficient for a single instance. For multi-instance deployment use Redis (see *Scalability Considerations*). |

## Tech Stack

| Layer      | Technology              |
| ---------- | ---------------------- |
| Backend    | NestJS, TypeScript     |
| Database   | PostgreSQL, Prisma ORM |
| Frontend   | React, TypeScript, Vite|
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

Or with psql:

```sql
CREATE DATABASE shorty;
```

### 2. Environment Variables

Copy the example into the `backend/` directory (Prisma loads `.env` from there):

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shorty?schema=public"
PORT=3000
NODE_ENV=development
```

Replace `USER` and `PASSWORD` with your PostgreSQL credentials. With Homebrew PostgreSQL, the username is often your Mac username and no password is needed:

```
DATABASE_URL="postgresql://your_user@localhost:5432/shorty?schema=public"
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

## Development Tools

This project uses several tools to ensure code and commit quality.

### ESLint

Linting is set up for both backend (NestJS/TypeScript) and frontend (React/TypeScript), with recommended rules, `eslint-config-prettier` to avoid conflicts with Prettier, and React/React Hooks plugins.

```bash
pnpm lint          # Check code
pnpm lint:fix      # Automatically fix issues
```

### Prettier

Code formatting based on `.prettierrc` (semicolons, single quotes, trailing commas for ES5, etc.). Applied to `.ts`, `.tsx`, `.css`, and `.json` files.

```bash
pnpm format        # Format all files
```

### Commitlint

Validates commit messages using [Conventional Commits](https://www.conventionalcommits.org/). Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`.

Example: `feat: add custom short codes`

### Husky + lint-staged

- **pre-commit**: runs `lint-staged` before each commit — ESLint (with `--fix`) and Prettier on staged files (`.ts`, `.tsx`, `.css`, `.json`).
- **commit-msg** : runs `commitlint` to validate the commit message.

No manual actions required: hooks are triggered automatically during `git commit`.

### Testing

The project includes a full test suite for the backend (Jest) and frontend (Vitest + React Testing Library).

```bash
pnpm test          # Runs all tests (backend + frontend)
pnpm test:watch    # Watch mode, backend only
```

**Backend (NestJS + Jest)**

- **Services:** `UrlValidatorService`, `ShortCodeService`, `ShortenService`, `RedirectService`
- **Controllers:** `ShortenController`, `RedirectController`
- **Guards & filters:** `RateLimitGuard`, `HttpExceptionFilter`
- **Coverage:** URL validation (empty, length, invalid protocols), Base62 code generation, collisions, rate limits, error handling

```bash
cd backend && pnpm test        # Single run
cd backend && pnpm test:watch # Watch mode
```

**Frontend (React + Vitest)**

- **API:** `validateUrl`, `shortenUrl` (success, 400/429 errors, network)
- **Components:** `ShortenForm`, `ShortUrlResult`, `App`
- **Coverage:** client-side validation, API calls, copy feedback, error display

```bash
cd frontend && pnpm test:run   # Single run
cd frontend && pnpm test      # Watch mode
```

## API Endpoints

| Method | Path           | Description                      |
| ------ | -------------- | -------------------------------- |
| POST   | /api/shorten   | Shorten a URL (rate limited)     |
| GET    | /:shortCode    | Redirect to original URL (302)   |

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

## Security

### Security Measures Implemented

#### 1. URL Validation

- **Allowed protocols:** Only `http://` and `https://`
- **Rejected protocols:** `javascript:`, `data:`, `file:`, `ftp:`, etc. (prevents XSS, code execution, local file leaks)
- **Open redirect prevention:** Protocol whitelist blocks redirects to malicious targets
- **Max length:** 2048 characters to prevent abuse
- **Implementation:** `UrlValidatorService` + `class-validator` on the DTO

#### 2. Input Sanitization

- **Global validation:** NestJS `ValidationPipe` with `class-validator`
- **`whitelist: true`** — strips properties not declared in DTO
- **`forbidNonWhitelisted: true`** — rejects requests with unknown properties (400)
- **`transform: true`** — automatically typecasts values to DTO types
- **DTO:** `ShortenDto` uses `@IsString`, `@IsNotEmpty`, `@MaxLength(2048)` on `url`

#### 3. HTTP Security Headers (Helmet)

- **X-Content-Type-Options:** `nosniff` — prevents MIME sniffing
- **X-Frame-Options:** clickjacking protection
- **X-XSS-Protection:** browser XSS protection
- **Strict-Transport-Security (HSTS):** enforces HTTPS in production
- **Other headers:** Helmet defaults for HTTP security

#### 4. Error Handling

- **Global filter:** `HttpExceptionFilter` applied to the entire app
- **Client response:** only generic error messages exposed
- **No leaks:** no stack traces, internal details, or sensitive data exposed to clients
- **Unhandled errors:** logged on server, generic "An unexpected error occurred" sent to client

#### 5. Consistent HTTP Codes

- **400** — validation failed, invalid URL
- **404** — short code does not exist
- **429** — rate limit exceeded

### Rate Limiting — Detailed Configuration

Rate limiting is enforced via a **NestJS Guard** (`RateLimitGuard`) on the `POST /api/shorten` controller.

| Parameter       | Value                | Description                                      |
| --------------- | -------------------- | ------------------------------------------------ |
| **Identifier**  | Client IP            | Each window is per-IP                            |
| **Target**      | `POST /api/shorten`  | Short link creation endpoint only                |
| **Window**      | 60 seconds (1 min)   | Sliding window                                   |
| **Limit**       | 10 requests/window   | Max 10 requests per IP per minute                |
| **Algorithm**   | Sliding window       | Counter resets when window expires               |

**Behavior:**

- First request from an IP: create entry `{ count: 1, resetAt: now + 60s }`
- Next requests: increment counter as long as `now < resetAt`
- If `count >= 10`: HTTP **429** with `"Too many requests. Please try again later."`
- If `now > resetAt`: window expired → reset counter to 1, open new window

**IP Extraction:**

- Behind a proxy: uses `X-Forwarded-For` (first IP = client)
- Otherwise: `request.ip` or `request.socket.remoteAddress`

**Storage:** In-memory (`Map<IP, { count, resetAt }>`). Data is lost on restart. For multi-instance deployment, replace with Redis (see *Scalability Considerations*).

## Scalability Considerations (Not Implemented)

These are documented for future work; they are **not** implemented in the current codebase:

1. **Rate limiting:** Use Redis instead of in-memory storage for multi-instance deployments.
2. **Database:** Add read replicas for redirect traffic; use connection pooling (e.g., PgBouncer).
3. **Caching:** Cache short code → long URL lookups in Redis for high-traffic redirects.
4. **Horizontal scaling:** Run multiple NestJS instances behind a load balancer; ensure DB and rate limiter are shared.
5. **Monitoring:** Add metrics (latency, error rate) and structured logging for production observability.

## Security Improvements (Not Implemented)

Potential enhancements for production-grade security:

1. **Security event logging:** Track validation failures, 429 responses, and attempts to access non-existent codes to detect abuse.
2. **Audit trail:** Record short link creation events (IP, timestamp, URL) for forensic analysis.
3. **Malicious domain blocking:** Blacklist known malware/phishing domains to prevent shortening dangerous URLs.
4. **Redirect limitation:** Prevent redirect chains (A → B → C) by detecting loops or excessive redirect sequences.
5. **Query parameter stripping:** When redirecting, remove or sanitize query parameters to avoid open redirect via `?url=...` tricks.
6. **Short code enumeration protection:** Rate limit or throttle redirects on unknown codes to deter brute-force attacks.

## Possible Future Improvements

- Custom short codes (e.g., `/go/example`)
- Analytics (click counts, referrers)
- Expiry for short URLs
- Authentication to manage personal links
- Admin UI for viewing/managing shortened URLs

## License

MIT
