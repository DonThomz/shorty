import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShortCodeService } from './short-code.service';
import { PrismaService } from '../prisma/prisma.service';

const BASE62_REGEX = /^[a-zA-Z0-9]{7}$/;

describe('ShortCodeService', () => {
  let service: ShortCodeService;

  const mockPrisma = {
    shortUrl: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortCodeService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ShortCodeService>(ShortCodeService);
  });

  describe('generateUnique', () => {
    it('generates codes of 7 characters', async () => {
      mockPrisma.shortUrl.findUnique.mockResolvedValue(null);

      const code = await service.generateUnique();

      expect(code).toHaveLength(7);
    });

    it('generates Base62 characters only (a-z, A-Z, 0-9)', async () => {
      mockPrisma.shortUrl.findUnique.mockResolvedValue(null);

      const codes = await Promise.all([
        service.generateUnique(),
        service.generateUnique(),
        service.generateUnique(),
      ]);

      codes.forEach((code) => {
        expect(code).toMatch(BASE62_REGEX);
      });
    });

    it('handles collisions by retrying', async () => {
      mockPrisma.shortUrl.findUnique
        .mockResolvedValueOnce({
          shortCode: 'abc1234',
          longUrl: 'x',
          id: '1',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          shortCode: 'def5678',
          longUrl: 'x',
          id: '2',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce(null);

      const code = await service.generateUnique();

      expect(code).toHaveLength(7);
      expect(mockPrisma.shortUrl.findUnique).toHaveBeenCalledTimes(3);
    });

    it('throws InternalServerErrorException after 10 collision attempts', async () => {
      mockPrisma.shortUrl.findUnique.mockResolvedValue({
        shortCode: 'x',
        id: '1',
        createdAt: new Date(),
      });

      await expect(service.generateUnique()).rejects.toMatchObject({
        constructor: InternalServerErrorException,
        message: 'Failed to generate unique short code. Please try again.',
      });

      expect(mockPrisma.shortUrl.findUnique).toHaveBeenCalledTimes(10);
    });
  });
});
