import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ShortenModule } from './shorten/shorten.module';
import { RedirectModule } from './redirect/redirect.module';

/** Root application module. Aggregates Prisma, Shorten, and Redirect modules. */
@Module({
  imports: [PrismaModule, ShortenModule, RedirectModule],
})
export class AppModule {}
