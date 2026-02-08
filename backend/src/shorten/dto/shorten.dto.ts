import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/** DTO for POST /api/shorten. Validated by class-validator. */
export class ShortenDto {
  @IsString()
  @IsNotEmpty({ message: 'URL is required' })
  @MaxLength(2048, { message: 'URL is too long' })
  url!: string;
}
