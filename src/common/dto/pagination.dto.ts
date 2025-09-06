import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

/**
 * Standard pagination query DTO
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Page must be a positive number' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Limit must be a positive number' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 10;

  /**
   * Calculate skip value for database queries
   */
  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  /**
   * Get normalized pagination values
   */
  getNormalized(): { page: number; limit: number; skip: number } {
    const normalizedPage = Math.max(1, this.page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, this.limit || 10));
    const skip = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip,
    };
  }
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Utility class for pagination calculations
 */
export class PaginationHelper {
  /**
   * Calculate pagination metadata
   */
  static calculateMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Validate and normalize pagination parameters
   */
  static normalize(
    page?: number,
    limit?: number,
  ): { page: number; limit: number; skip: number } {
    const normalizedPage = Math.max(1, page || 1);
    const normalizedLimit = Math.min(100, Math.max(1, limit || 10));
    const skip = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip,
    };
  }

  /**
   * Create pagination response
   */
  static createResponse<T>(
    data: T[],
    pagination: { page: number; limit: number },
    total: number,
  ) {
    const meta = this.calculateMeta(pagination.page, pagination.limit, total);
    return { data, meta };
  }
}
