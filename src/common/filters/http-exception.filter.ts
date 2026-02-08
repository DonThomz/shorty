import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter. Ensures safe error responses:
 * - No internal error details leaked to client
 * - Consistent JSON format for API errors
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : String(exceptionResponse);
      if (Array.isArray(message)) {
        message = message[0] || 'Validation failed';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status === 429 ? 'Too Many Requests' : status >= 500 ? 'Internal Server Error' : 'Bad Request',
    });
  }
}
