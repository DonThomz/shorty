import { IsString, IsNotEmpty, IsUrl, Length } from 'class-validator';
import { IsSafeUrl } from '../validators/safe-url.validator';

/**
 * DTO for URL shortening request.
 * Validation ensures only http:// and https:// URLs are accepted.
 * Rejects javascript:, data:, file:, ftp:, etc.
 */
export class ShortenDto {
  @IsString()
  @IsNotEmpty({ message: 'URL is required' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    },
    { message: 'URL must be valid and use http:// or https:// only' },
  )
  @IsSafeUrl({ message: 'URL must use http:// or https:// only' })
  @Length(11, 2048, { message: 'URL length must be between 11 and 2048 characters' })
  url!: string;
}
