import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

/** Module for short URL redirection (GET /:shortCode). */
@Module({
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
