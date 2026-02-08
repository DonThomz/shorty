import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { RedirectService } from './redirect.service';

const SHORT_CODE_LENGTH = 7;
const BASE62_REGEX = /^[a-zA-Z0-9]{7}$/;

@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) { }

  /**
   * GET /:shortCode - Redirects to original URL (302).
   * Returns 404 if shortCode does not exist or is invalid format.
   */
  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: Response) {
    // Validate format: exactly 7 Base62 characters
    if (!BASE62_REGEX.test(shortCode) || shortCode.length !== SHORT_CODE_LENGTH) {
      throw new NotFoundException('Short URL not found');
    }

    const longUrl = await this.redirectService.findLongUrl(shortCode);
    if (!longUrl) {
      throw new NotFoundException('Short URL not found');
    }

    // Redirect is safe: longUrl was validated on creation (http/https only)
    res.redirect(302, longUrl);
  }
}
