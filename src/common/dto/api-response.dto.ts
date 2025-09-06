/**
 * Standard API response wrapper
 */
export class ApiResponseDto<T = any> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;

  constructor(
    data: T,
    message = 'Success',
    statusCode = 200,
    path = '',
    timestamp?: string,
  ) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.path = path;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message = 'Success',
    statusCode = 200,
    path = '',
    timestamp?: string,
  ) {
    super(data, message, statusCode, path, timestamp);
    this.meta = meta;
  }
}

/**
 * Error response structure
 */
export class ErrorResponseDto {
  error: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  details?: string[] | object;
  errorCode?: string;

  constructor(
    message: string,
    statusCode: number,
    path = '',
    details?: string[] | object,
    errorCode?: string,
    timestamp?: string,
  ) {
    this.error = true;
    this.message = message;
    this.statusCode = statusCode;
    this.path = path;
    this.timestamp = timestamp || new Date().toISOString();
    if (details) this.details = details;
    if (errorCode) this.errorCode = errorCode;
  }
}
