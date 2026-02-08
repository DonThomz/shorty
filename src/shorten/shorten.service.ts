import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SHORT_CODE_LENGTH = 7;
const MAX_COLLISION_RETRIES = 10;

@Injectable()
export class ShortenService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Generates a random Base62 string of 7 characters.
   * Collision handling: retries up to MAX_COLLISION_RETRIES times.
   */
  private generateShortCode(): string {
    let result = '';
    for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
      result += BASE62_CHARS.charAt(Math.floor(Math.random() * BASE62_CHARS.length));
    }
    return result;
  }

  /**
   * Creates a short URL for the given long URL.
   * Multiple short URLs can point to the same long URL.
   */
  async createShortUrl(longUrl: string): Promise<{ shortCode: string; shortUrl: string }> {
    const baseUrl = this.getBaseUrl();

    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const shortCode = this.generateShortCode();

      try {
        await this.prisma.shortUrl.create({
          data: { shortCode, longUrl },
        });
        return {
          shortCode,
          shortUrl: `${baseUrl}/${shortCode}`,
        };
      } catch (error) {
        // Unique constraint violation - collision, retry
        const isPrismaUniqueError =
          error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002';
        if (!isPrismaUniqueError) {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate unique short code after retries');
  }

  /**
   * Looks up long URL by short code. Returns null if not found.
   */
  async findLongUrl(shortCode: string): Promise<string | null> {
    const record = await this.prisma.shortUrl.findUnique({
      where: { shortCode },
    });
    return record?.longUrl ?? null;
  }

  private getBaseUrl(): string {
    const base = process.env.BASE_URL;
    if (base) {
      return base.replace(/\/$/, ''); // Remove trailing slash
    }
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
  }
}
