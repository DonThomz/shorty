import { Module } from '@nestjs/common';
import { ShortenModule } from './shorten/shorten.module';
import { RedirectModule } from './redirect/redirect.module';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ShortenModule, RedirectModule],
  controllers: [AppController],
})
export class AppModule { }
