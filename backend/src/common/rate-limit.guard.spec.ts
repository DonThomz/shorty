import { HttpStatus, ExecutionContext } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  const createMockRequest = (
    overrides: Partial<{
      ip: string;
      socket: { remoteAddress?: string };
      get: (name: string) => string | undefined;
    }> = {}
  ) => ({
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    get: () => undefined,
    ...overrides,
  });

  const createContext = (request: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    guard = new RateLimitGuard();
  });

  it('allows N requests (10)', () => {
    const req = createMockRequest({ ip: '192.168.1.1' });
    const ctx = createContext(req);

    for (let i = 0; i < 10; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('blocks at N+1 (11th request)', () => {
    const req = createMockRequest({ ip: '192.168.1.2' });
    const ctx = createContext(req);

    for (let i = 0; i < 10; i++) {
      guard.canActivate(ctx);
    }

    expect(() => guard.canActivate(ctx)).toThrow();
    try {
      guard.canActivate(ctx);
    } catch (e: unknown) {
      const err = e as { status: number; response: { message: string } };
      expect(err.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(err.response.message).toContain('Too many requests');
    }
  });

  it('resets after window expires', () => {
    jest.useFakeTimers();
    const req = createMockRequest({ ip: '192.168.1.3' });
    const ctx = createContext(req);

    for (let i = 0; i < 10; i++) {
      guard.canActivate(ctx);
    }

    expect(() => guard.canActivate(ctx)).toThrow();

    jest.advanceTimersByTime(61 * 1000); // 61 seconds

    expect(guard.canActivate(ctx)).toBe(true);
    jest.useRealTimers();
  });

  it('extracts IP from x-forwarded-for (first IP when behind proxy)', () => {
    const req = createMockRequest({
      get: (name: string) => (name === 'x-forwarded-for' ? '203.0.113.1, 10.0.0.1' : undefined),
      ip: '10.0.0.1',
    });
    const ctx = createContext(req);

    expect(guard.canActivate(ctx)).toBe(true);

    for (let i = 0; i < 9; i++) {
      guard.canActivate(ctx);
    }

    expect(() => guard.canActivate(ctx)).toThrow();
  });
});
