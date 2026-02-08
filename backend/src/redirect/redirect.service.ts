import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedirectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds the original URL for a given short code.
   *
   * @param shortCode - The 7-character short code
   * @returns The long URL or null if not found
   */
  async findLongUrl(shortCode: string): Promise<string | null> {
    const record = await this.prisma.shortUrl.findUnique({
      where: { shortCode },
    });
    return record?.longUrl ?? null;
  }
}
