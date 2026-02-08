import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global module providing the Prisma client across the app. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
