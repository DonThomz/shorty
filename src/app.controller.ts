import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

/**
 * Serves the React SPA for non-API routes.
 * NestJS routes are matched in order - API and redirect routes take precedence.
 */
@Controller()
export class AppController {
  @Get()
  serveApp(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'client-dist', 'index.html'));
  }
}
