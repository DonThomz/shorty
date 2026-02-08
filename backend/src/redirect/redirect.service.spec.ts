import { Test, TestingModule } from '@nestjs/testing';
import { RedirectService } from './redirect.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RedirectService', () => {
  let service: RedirectService;

  const mockPrisma = {
    shortUrl: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedirectService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<RedirectService>(RedirectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findLongUrl', () => {
    it('returns the long URL when shortCode exists', async () => {
      const shortCode = 'abc1234';
      const longUrl = 'https://example.com/original';
      mockPrisma.shortUrl.findUnique.mockResolvedValue({
        shortCode,
        longUrl,
        id: '1',
        createdAt: new Date(),
      });

      const result = await service.findLongUrl(shortCode);

      expect(mockPrisma.shortUrl.findUnique).toHaveBeenCalledWith({ where: { shortCode } });
      expect(result).toBe(longUrl);
    });

    it('returns null when shortCode does not exist', async () => {
      mockPrisma.shortUrl.findUnique.mockResolvedValue(null);

      const result = await service.findLongUrl('nonexistent');

      expect(result).toBeNull();
    });
  });
});
