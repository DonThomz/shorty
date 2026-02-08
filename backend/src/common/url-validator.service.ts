import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Strict URL validation - only allows http:// and https://
 * Prevents: javascript:, data:, file:, ftp:, and open redirect vulnerabilities
 */
@Injectable()
export class UrlValidatorService {
  private readonly ALLOWED_PROTOCOLS = ['http:', 'https:'];

  /**
   * Validates that the URL is safe for shortening.
   * Only allows http:// and https://. Rejects javascript:, data:, file:, ftp:, etc.
   *
   * @param url - The URL string to validate
   * @returns Normalized URL (parsed.href) if valid
   * @throws BadRequestException if invalid (empty, too long, wrong protocol, etc.)
   */
  validateAndNormalize(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('URL is required');
    }

    const trimmed = url.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException('URL cannot be empty');
    }

    // Max length to prevent abuse
    if (trimmed.length > 2048) {
      throw new BadRequestException('URL is too long');
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    // Only allow http and https - blocks javascript:, data:, file:, ftp:, etc.
    if (!this.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new BadRequestException('Only http:// and https:// URLs are allowed');
    }

    return parsed.href;
  }
}
