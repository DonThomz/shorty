import { Test, TestingModule } from '@nestjs/testing';
import { ShortenController } from './shorten.controller';
import { ShortenService } from './shorten.service';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { Request } from 'express';

describe('ShortenController', () => {
  let controller: ShortenController;

  const mockShortenService = {
    createShortUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortenController],
      providers: [{ provide: ShortenService, useValue: mockShortenService }],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ShortenController>(ShortenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/shorten', () => {
    it('returns 201 with shortUrl', async () => {
      const dto = { url: 'https://example.com' };
      const shortUrl = 'http://localhost:3000/abc1234';
      mockShortenService.createShortUrl.mockResolvedValue(shortUrl);

      const req = {
        get: jest.fn().mockImplementation((name: string) => {
          if (name === 'x-forwarded-proto') return 'https';
          if (name === 'host') return 'shorty.example.com';
          return undefined;
        }),
        protocol: 'http',
      } as unknown as Request;

      const result = await controller.shorten(dto, req);

      expect(result).toEqual({ shortUrl });
      expect(mockShortenService.createShortUrl).toHaveBeenCalledWith(
        dto.url,
        'https://shorty.example.com'
      );
    });

    it('getBaseUrl uses x-forwarded-proto and host', async () => {
      const req = {
        get: jest.fn().mockImplementation((name: string) => {
          if (name === 'x-forwarded-proto') return 'https';
          if (name === 'host') return 'app.example.com';
          return undefined;
        }),
        protocol: 'http',
      } as unknown as Request;

      const shortUrl = 'https://app.example.com/xyz7890';
      mockShortenService.createShortUrl.mockResolvedValue(shortUrl);

      const result = await controller.shorten({ url: 'https://example.com' }, req);

      expect(result.shortUrl).toBe(shortUrl);
      expect(mockShortenService.createShortUrl).toHaveBeenCalledWith(
        'https://example.com',
        'https://app.example.com'
      );
    });

    it('falls back to req.protocol and host when no proxy headers', async () => {
      const req = {
        get: jest.fn().mockReturnValue(undefined),
        protocol: 'http',
      } as unknown as Request;

      mockShortenService.createShortUrl.mockResolvedValue('http://localhost:3000/abc1234');

      const result = await controller.shorten({ url: 'https://example.com' }, req);

      expect(result.shortUrl).toBe('http://localhost:3000/abc1234');
      expect(mockShortenService.createShortUrl).toHaveBeenCalledWith(
        'https://example.com',
        'http://localhost:3000'
      );
    });
  });
});
