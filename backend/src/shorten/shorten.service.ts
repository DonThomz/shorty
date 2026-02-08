import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UrlValidatorService } from '../common/url-validator.service';
import { ShortCodeService } from '../common/short-code.service';

@Injectable()
export class ShortenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly urlValidator: UrlValidatorService,
    private readonly shortCodeService: ShortCodeService,
  ) {}

  /**
   * Creates a short URL: validates, generates unique code, persists, returns full URL.
   *
   * @param longUrl - The URL to shorten
   * @param baseUrl - Base URL (e.g. http://localhost:3000) for the short link
   * @returns Full short URL (e.g. http://localhost:3000/abc1234)
   */
  async createShortUrl(longUrl: string, baseUrl: string): Promise<string> {
    const normalizedUrl = this.urlValidator.validateAndNormalize(longUrl);
    const shortCode = await this.shortCodeService.generateUnique();

    await this.prisma.shortUrl.create({
      data: {
        shortCode,
        longUrl: normalizedUrl,
      },
    });

    return `${baseUrl}/${shortCode}`;
  }
}
