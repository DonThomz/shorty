import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';
import { Response } from 'express';

describe('RedirectController', () => {
  let controller: RedirectController;

  const mockRedirectService = {
    findLongUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedirectController],
      providers: [{ provide: RedirectService, useValue: mockRedirectService }],
    }).compile();

    controller = module.get<RedirectController>(RedirectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /:shortCode', () => {
    it('returns 302 redirect when shortCode exists', async () => {
      const shortCode = 'abc1234';
      const longUrl = 'https://example.com/original';
      mockRedirectService.findLongUrl.mockResolvedValue(longUrl);

      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.redirect(shortCode, res);

      expect(mockRedirectService.findLongUrl).toHaveBeenCalledWith(shortCode);
      expect(res.redirect).toHaveBeenCalledWith(HttpStatus.FOUND, longUrl);
    });

    it('throws 404 when shortCode does not exist', async () => {
      mockRedirectService.findLongUrl.mockResolvedValue(null);

      const res = {
        redirect: jest.fn(),
      } as unknown as Response;

      await expect(controller.redirect('nonexistent', res)).rejects.toThrow('Short URL not found');
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
