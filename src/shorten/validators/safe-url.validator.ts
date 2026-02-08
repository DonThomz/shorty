import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Rejects dangerous URL schemes: javascript:, data:, file:, ftp:, etc.
 * Only http:// and https:// are allowed.
 */
@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  validate(url: string): boolean {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  }

  defaultMessage(): string {
    return 'URL must use http:// or https:// only. Other schemes are not allowed.';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}
