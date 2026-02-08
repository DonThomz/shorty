import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BASE62_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SHORT_CODE_LENGTH = 7;

@Injectable()
export class ShortCodeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a random Base62 string of fixed length (7 chars).
   * Retries on collision until a unique code is found (max 10 attempts).
   *
   * @returns A unique 7-character short code (a-z, A-Z, 0-9)
   * @throws InternalServerErrorException if unable to generate unique code after retries
   */
  async generateUnique(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateRandom();
      const exists = await this.prisma.shortUrl.findUnique({
        where: { shortCode: code },
      });
      if (!exists) {
        return code;
      }
    }
    throw new InternalServerErrorException(
      'Failed to generate unique short code. Please try again.'
    );
  }

  /** Generates a random Base62 string of SHORT_CODE_LENGTH (7) characters. */
  private generateRandom(): string {
    let result = '';
    for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
      const index = Math.floor(Math.random() * BASE62_CHARS.length);
      result += BASE62_CHARS[index];
    }
    return result;
  }
}
