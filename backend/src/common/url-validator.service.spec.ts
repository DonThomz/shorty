import { BadRequestException } from '@nestjs/common';
import { UrlValidatorService } from './url-validator.service';

describe('UrlValidatorService', () => {
  let service: UrlValidatorService;

  beforeEach(() => {
    service = new UrlValidatorService();
  });

  describe('rejects invalid inputs', () => {
    it('rejects empty string', () => {
      expect(() => service.validateAndNormalize('')).toThrow(BadRequestException);
      expect(() => service.validateAndNormalize('')).toThrow('URL is required');
    });

    it('rejects whitespace-only string', () => {
      expect(() => service.validateAndNormalize('   ')).toThrow(BadRequestException);
      expect(() => service.validateAndNormalize('   ')).toThrow('URL cannot be empty');
    });

    it('rejects null', () => {
      expect(() => service.validateAndNormalize(null as unknown as string)).toThrow(
        BadRequestException
      );
      expect(() => service.validateAndNormalize(null as unknown as string)).toThrow(
        'URL is required'
      );
    });

    it('rejects non-string (number)', () => {
      expect(() => service.validateAndNormalize(123 as unknown as string)).toThrow(
        BadRequestException
      );
    });

    it('rejects URL longer than 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2040);
      expect(() => service.validateAndNormalize(longUrl)).toThrow(BadRequestException);
      expect(() => service.validateAndNormalize(longUrl)).toThrow('URL is too long');
    });

    it('rejects invalid URL format', () => {
      expect(() => service.validateAndNormalize('not-a-url')).toThrow(BadRequestException);
      expect(() => service.validateAndNormalize('not-a-url')).toThrow('Invalid URL format');
    });
  });

  describe('rejects forbidden protocols', () => {
    it('rejects javascript: protocol', () => {
      expect(() => service.validateAndNormalize('javascript:alert(1)')).toThrow(
        BadRequestException
      );
      expect(() => service.validateAndNormalize('javascript:alert(1)')).toThrow(
        'Only http:// and https:// URLs are allowed'
      );
    });

    it('rejects data: protocol', () => {
      expect(() =>
        service.validateAndNormalize('data:text/html,<script>alert(1)</script>')
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateAndNormalize('data:text/html,<script>alert(1)</script>')
      ).toThrow('Only http:// and https:// URLs are allowed');
    });

    it('rejects file: protocol', () => {
      expect(() => service.validateAndNormalize('file:///etc/passwd')).toThrow(BadRequestException);
      expect(() => service.validateAndNormalize('file:///etc/passwd')).toThrow(
        'Only http:// and https:// URLs are allowed'
      );
    });

    it('rejects ftp: protocol', () => {
      expect(() => service.validateAndNormalize('ftp://example.com/file')).toThrow(
        BadRequestException
      );
      expect(() => service.validateAndNormalize('ftp://example.com/file')).toThrow(
        'Only http:// and https:// URLs are allowed'
      );
    });
  });

  describe('accepts and normalizes valid URLs', () => {
    it('accepts http:// URL and returns normalized href', () => {
      const result = service.validateAndNormalize('http://example.com/path');
      expect(result).toBe('http://example.com/path');
    });

    it('accepts https:// URL and returns normalized href', () => {
      const result = service.validateAndNormalize('https://example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('normalizes URL with trailing slashes and query params', () => {
      const result = service.validateAndNormalize('  https://example.com/path?foo=bar  ');
      expect(result).toBe('https://example.com/path?foo=bar');
    });

    it('accepts URL with port', () => {
      const result = service.validateAndNormalize('http://localhost:3000/api');
      expect(result).toBe('http://localhost:3000/api');
    });
  });
});
