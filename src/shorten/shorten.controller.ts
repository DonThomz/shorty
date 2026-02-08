import { Controller, Post, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ShortenService } from './shorten.service';
import { ShortenDto } from './dto/shorten.dto';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller('api')
export class ShortenController {
  constructor(private readonly shortenService: ShortenService) { }

  @Post('shorten')
  @UseGuards(RateLimitGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async shorten(@Body() dto: ShortenDto) {
    const { shortUrl } = await this.shortenService.createShortUrl(dto.url.trim());
    return { shortUrl };
  }
}
