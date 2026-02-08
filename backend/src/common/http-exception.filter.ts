import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';

/**
 * Global exception filter - prevents internal error details from leaking to clients.
 * Returns safe, user-facing messages only.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Handles all exceptions. Returns safe user-facing messages only.
   * Logs unhandled errors internally without exposing stack traces.
   *
   * @param exception - The thrown exception (any type)
   * @param host - NestJS execution context host
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    // Get HTTP context (response, request) from NestJS host
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Default values: 500 + generic message (avoids leaking internal info)
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again.';

    if (exception instanceof HttpException) {
      // NestJS exception (BadRequest, NotFound, etc.): extract status and message
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // NestJS can return { message: string } or { message: string[] } (validation)
      const rawMessage =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : String(exceptionResponse);

      // If array (validation errors), take the first one
      message = Array.isArray(rawMessage)
        ? rawMessage[0] || 'Validation failed'
        : rawMessage;
    } else if (exception instanceof Error) {
      // Unhandled error: log internally (with stack trace) without exposing to client
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // Uniform JSON response: always { statusCode, message }
    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
