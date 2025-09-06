import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiResponseDto,
  ErrorResponseDto,
  PaginatedResponseDto,
} from '../dto/api-response.dto';
import { PaginationHelper, PaginationMeta } from '../dto/pagination.dto';

/**
 * Utility class for creating standardized responses
 */
export class ResponseUtil {
  /**
   * Create success response
   */
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    path = '',
  ): ApiResponseDto<T> {
    return new ApiResponseDto(data, message, statusCode, path);
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message = 'Data retrieved successfully',
    statusCode = 200,
    path = '',
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, meta, message, statusCode, path);
  }

  /**
   * Create paginated response with auto-calculated meta
   */
  static paginatedAuto<T>(
    data: T[],
    pagination: { page: number; limit: number },
    total: number,
    message = 'Data retrieved successfully',
    statusCode = 200,
    path = '',
  ): PaginatedResponseDto<T> {
    const meta = PaginationHelper.calculateMeta(
      pagination.page,
      pagination.limit,
      total,
    );
    return new PaginatedResponseDto(data, meta, message, statusCode, path);
  }

  /**
   * Create error response (for manual error handling)
   */
  static error(
    message: string,
    statusCode = 500,
    path = '',
    details?: string[] | object,
    errorCode?: string,
  ): ErrorResponseDto {
    return new ErrorResponseDto(message, statusCode, path, details, errorCode);
  }
}

/**
 * Utility class for throwing standardized exceptions
 */
export class ExceptionUtil {
  /**
   * Throw not found exception
   */
  static notFound(resource: string, identifier?: string | number): never {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;

    throw new HttpException(
      {
        message,
        error: 'NOT_FOUND',
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Throw validation exception
   */
  static validation(message: string, details?: string[] | object): never {
    throw new HttpException(
      {
        message,
        error: 'VALIDATION_ERROR',
        details,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  /**
   * Throw conflict exception
   */
  static conflict(message: string, details?: string[] | object): never {
    throw new HttpException(
      {
        message,
        error: 'CONFLICT',
        details,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Throw unauthorized exception
   */
  static unauthorized(message = 'Unauthorized access'): never {
    throw new HttpException(
      {
        message,
        error: 'UNAUTHORIZED',
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * Throw forbidden exception
   */
  static forbidden(message = 'Access forbidden'): never {
    throw new HttpException(
      {
        message,
        error: 'FORBIDDEN',
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * Throw bad request exception
   */
  static badRequest(message: string, details?: string[] | object): never {
    throw new HttpException(
      {
        message,
        error: 'BAD_REQUEST',
        details,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Throw internal server error
   */
  static internal(message = 'Internal server error'): never {
    throw new HttpException(
      {
        message,
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
