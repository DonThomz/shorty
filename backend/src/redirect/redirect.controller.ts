import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { RedirectService } from './redirect.service';

/** Handles GET /:shortCode - redirects to the original long URL. */
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) { }

  /**
   * Looks up the short code and redirects (302) to the original URL.
   * Returns 404 if the short code does not exist.
   *
   * @param shortCode - The 7-character short code from the URL path
   * @param res - Express response for redirect
   */
  @Get(':shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Res() res: Response,
  ): Promise<void> {
    const longUrl = await this.redirectService.findLongUrl(shortCode);
    console.log('longUrl', longUrl);
    if (!longUrl) {
      throw new NotFoundException('Short URL not found');
    }

    res.redirect(HttpStatus.FOUND, longUrl);
  }
}
