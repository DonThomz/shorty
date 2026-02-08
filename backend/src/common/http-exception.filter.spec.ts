import {
  HttpStatus,
  BadRequestException,
  NotFoundException,
  HttpException,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  const createHost = (): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as ArgumentsHost;
  };

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats HttpException correctly', () => {
    const exception = new BadRequestException('URL is required');

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'URL is required',
    });
  });

  it('handles validation errors (array message)', () => {
    const exception = new BadRequestException(['URL is required', 'URL must be valid']);

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'URL is required',
    });
  });

  it('handles HttpException with empty array message (fallback to Validation failed)', () => {
    const exception = new BadRequestException([]);

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
    });
  });

  it('handles HttpException with non-object response (plain string)', () => {
    const exception = new HttpException('Plain error message', HttpStatus.BAD_REQUEST);

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Plain error message',
    });
  });

  it('handles HttpException with object response without message key', () => {
    const exception = new HttpException(
      { statusCode: 400, error: 'Bad Request' },
      HttpStatus.BAD_REQUEST
    );

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: '[object Object]',
    });
  });

  it('handles HttpException with array containing empty string (fallback to Validation failed)', () => {
    const exception = new BadRequestException(['']);

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
    });
  });

  it('handles NotFoundException', () => {
    const exception = new NotFoundException('Short URL not found');

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Short URL not found',
    });
  });

  it('returns generic message for unhandled errors (no stack trace leak)', () => {
    const exception = new Error('Internal database error');

    filter.catch(exception, createHost());

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please try again.',
    });
  });
});
