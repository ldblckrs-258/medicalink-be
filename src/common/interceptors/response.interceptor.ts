import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NullableType } from 'src/utils/types/nullable.type';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/api-response.dto';

interface PaginationResponse<T> {
  data: T[];
  meta: unknown;
}

/**
 * Type guard to check if data is a pagination response
 */
function isPaginationResponse<T>(data: unknown): data is PaginationResponse<T> {
  const isObject = data !== null && typeof data === 'object';
  if (!isObject) {
    return false;
  }

  return (
    'data' in data &&
    'meta' in data &&
    Array.isArray((data as { data: unknown }).data) &&
    (data as { meta: unknown }).meta !== null &&
    typeof (data as { meta: unknown }).meta === 'object'
  );
}

/**
 * Type guard to check if data is an ApiResponseDto (using structure check)
 */
function isApiResponseDto<T>(data: unknown): data is ApiResponseDto<T> {
  const isObject = data !== null && typeof data === 'object';
  if (!isObject) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    'data' in obj &&
    'message' in obj &&
    'statusCode' in obj &&
    'timestamp' in obj &&
    'path' in obj &&
    typeof obj.message === 'string' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.path === 'string'
  );
}

/**
 * Type guard to check if data is a PaginatedResponseDto (using structure check)
 */
function isPaginatedResponseDto<T>(
  data: unknown,
): data is PaginatedResponseDto<T> {
  const isObject = data !== null && typeof data === 'object';
  if (!isObject) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    'data' in obj &&
    'meta' in obj &&
    'message' in obj &&
    'statusCode' in obj &&
    'timestamp' in obj &&
    'path' in obj &&
    Array.isArray(obj.data) &&
    typeof obj.message === 'string' &&
    typeof obj.statusCode === 'number' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.path === 'string' &&
    obj.meta !== null &&
    typeof obj.meta === 'object'
  );
}

type ApiResponse<T> = ApiResponseDto<NullableType<T>> | PaginatedResponseDto<T>;

/**
 * Interceptor to standardize all API responses
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<NullableType<T>, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    type ResponseType = T | null;
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: T | ApiResponseDto<T> | PaginatedResponseDto<T>) => {
        // If data is already wrapped in ApiResponseDto or PaginatedResponseDto, return as is
        // Check if this is a pagination response from PaginationHelper
        if (isPaginationResponse<T>(data)) {
          return new PaginatedResponseDto(
            data.data,
            data.meta,
            'Data retrieved successfully',
            response.statusCode,
            request.url,
          );
        }

        // Check if data is already wrapped (use structure check instead of instanceof)
        if (isPaginatedResponseDto(data)) {
          return {
            ...(data as PaginatedResponseDto<T>),
            path: request.url,
          };
        }

        if (isApiResponseDto(data)) {
          return {
            ...(data as ApiResponseDto<NullableType<T>>),
            path: request.url,
          };
        }

        let responseData: ResponseType = data;
        let message = 'Success';

        // Customize message based on HTTP method
        const method = request.method;
        switch (method) {
          case 'POST':
            message = 'Resource created successfully';
            break;
          case 'PUT':
          case 'PATCH':
            message = 'Resource updated successfully';
            break;
          case 'DELETE':
            message = 'Resource deleted successfully';
            break;
          case 'GET':
          default:
            message = 'Data retrieved successfully';
            break;
        }

        // Handle null/undefined data
        if (data === null || data === undefined) {
          responseData = null;
          message = 'No content';
        }

        // Handle array data
        if (Array.isArray(data)) {
          message =
            data.length > 0
              ? `Retrieved ${data.length} record(s) successfully`
              : 'No records found';
        }

        return new ApiResponseDto(
          responseData,
          message,
          response.statusCode,
          request.url,
        );
      }),
    );
  }
}
