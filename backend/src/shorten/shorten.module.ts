import { Module } from '@nestjs/common';
import { ShortenController } from './shorten.controller';
import { ShortenService } from './shorten.service';
import { UrlValidatorService } from '../common/url-validator.service';
import { ShortCodeService } from '../common/short-code.service';
import { RateLimitGuard } from '../common/rate-limit.guard';

/** Module for URL shortening (POST /api/shorten). */
@Module({
  controllers: [ShortenController],
  providers: [ShortenService, UrlValidatorService, ShortCodeService, RateLimitGuard],
})
export class ShortenModule {}
