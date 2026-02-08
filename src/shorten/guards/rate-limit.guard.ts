import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const key = `shorten:${ip}`;

    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.scheduleCleanup(key, WINDOW_MS);
      return true;
    }

    if (now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.scheduleCleanup(key, WINDOW_MS);
      return true;
    }

    entry.count++;
    if (entry.count > MAX_REQUESTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  private scheduleCleanup(key: string, delayMs: number): void {
    setTimeout(() => {
      this.store.delete(key);
    }, delayMs);
  }
}
