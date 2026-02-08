import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ShortenService } from './shorten.service';
import { ShortenDto } from './dto/shorten.dto';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { UseGuards } from '@nestjs/common';

/** Handles POST /api/shorten - creates a short URL from a long URL. */
@Controller('api/shorten')
export class ShortenController {
  constructor(private readonly shortenService: ShortenService) {}

  /**
   * Shortens a URL. Rate limited by IP. Validates input via DTO.
   *
   * @param dto - { url: string } from request body
   * @param req - Express request (used to build base URL)
   * @returns { shortUrl: string } - Full short URL including scheme and host
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async shorten(
    @Body() dto: ShortenDto,
    @Req() req: Request,
  ): Promise<{ shortUrl: string }> {
    const baseUrl = this.getBaseUrl(req);
    const shortUrl = await this.shortenService.createShortUrl(dto.url, baseUrl);
    return { shortUrl };
  }

  /** Builds the base URL (e.g. http://localhost:3000) from request headers. */
  private getBaseUrl(req: Request): string {
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
  }
}
