import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

/** Tracks request count and when the current window expires for an IP. */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory IP-based rate limiter for POST /api/shorten.
 * Returns 429 when limit exceeded.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  /** Map of client IP -> { count, resetAt } - resets on server restart */
  // TODO - Replace with Redis for multi-instance deployments
  private readonly storage = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 1000; // 1 minute

  /**
   * Checks if the client IP is within the rate limit.
   * Throws HTTP 429 if the limit is exceeded.
   *
   * @param context - NestJS execution context
   * @returns true if allowed to proceed
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const now = Date.now();

    const entry = this.storage.get(ip);

    // First request from this IP: create entry and allow
    if (!entry) {
      this.storage.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    // Window expired: reset and allow (sliding window)
    if (now > entry.resetAt) {
      this.storage.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    // Limit exceeded: reject with 429
    if (entry.count >= this.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Within limit: increment and allow
    entry.count++;
    return true;
  }

  /**
   * Extracts client IP from request.
   * Uses x-forwarded-for when behind a proxy (first IP = original client).
   */
  private getClientIp(request: Request): string {
    const forwarded = request.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
