import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedirectService {
  constructor(private readonly prisma: PrismaService) { }

  async findLongUrl(shortCode: string): Promise<string | null> {
    const record = await this.prisma.shortUrl.findUnique({
      where: { shortCode },
    });
    return record?.longUrl ?? null;
  }
}
