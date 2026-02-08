import { Test, TestingModule } from '@nestjs/testing';
import { ShortenService } from './shorten.service';
import { PrismaService } from '../prisma/prisma.service';
import { UrlValidatorService } from '../common/url-validator.service';
import { ShortCodeService } from '../common/short-code.service';

describe('ShortenService', () => {
  let service: ShortenService;

  const mockPrisma = {
    shortUrl: {
      create: jest.fn(),
    },
  };

  const mockUrlValidator = {
    validateAndNormalize: jest.fn(),
  };

  const mockShortCodeService = {
    generateUnique: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShortenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UrlValidatorService, useValue: mockUrlValidator },
        { provide: ShortCodeService, useValue: mockShortCodeService },
      ],
    }).compile();

    service = module.get<ShortenService>(ShortenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShortUrl', () => {
    it('calls UrlValidator and ShortCodeService, creates entry in DB, returns full short URL', async () => {
      const longUrl = 'https://example.com/long';
      const baseUrl = 'http://localhost:3000';
      const shortCode = 'abc1234';
      const normalizedUrl = 'https://example.com/long';

      mockUrlValidator.validateAndNormalize.mockReturnValue(normalizedUrl);
      mockShortCodeService.generateUnique.mockResolvedValue(shortCode);
      mockPrisma.shortUrl.create.mockResolvedValue({ shortCode, longUrl: normalizedUrl });

      const result = await service.createShortUrl(longUrl, baseUrl);

      expect(mockUrlValidator.validateAndNormalize).toHaveBeenCalledWith(longUrl);
      expect(mockShortCodeService.generateUnique).toHaveBeenCalled();
      expect(mockPrisma.shortUrl.create).toHaveBeenCalledWith({
        data: {
          shortCode,
          longUrl: normalizedUrl,
        },
      });
      expect(result).toBe('http://localhost:3000/abc1234');
    });
  });
});
