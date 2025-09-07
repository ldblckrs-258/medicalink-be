import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AllConfigType } from '../config/config.type';

interface HealthResponse {
  status: string;
  timestamp: string;
  service?: string;
  database?: string;
  version?: string;
}

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  private get isProduction(): boolean {
    return (
      this.configService.get('app.nodeEnv', { infer: true }) === 'production'
    );
  }

  private get backendDomain(): string {
    return this.configService.getOrThrow('app.backendDomain', { infer: true });
  }

  @Cron('0 */10 * * * *') // Every 10 minutes
  async handleKeepAlive() {
    if (!this.isProduction) {
      this.logger.debug('Keep-alive skipped: Not in production environment');
      return;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.backendDomain}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'MedicaLink-KeepAlive/1.0',
          'X-Keep-Alive': 'true',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = (await response.json()) as HealthResponse;
        this.logger.log(
          `Keep-alive successful: ${response.status} in ${duration}ms`,
          {
            status: data.status,
            timestamp: data.timestamp,
            duration: `${duration}ms`,
          },
        );
      } else {
        this.logger.warn(
          `Keep-alive failed: ${response.status} ${response.statusText}`,
          { duration: `${duration}ms` },
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Keep-alive request failed', {
        error: errorMessage,
        stack: errorStack,
      });
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerKeepAlive(): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
    duration?: number;
  }> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.backendDomain}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'MedicaLink-KeepAlive-Manual/1.0',
          'X-Keep-Alive': 'manual',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `Keep-alive successful: ${response.status}`,
          timestamp: new Date().toISOString(),
          duration,
        };
      } else {
        return {
          success: false,
          message: `Keep-alive failed: ${response.status} ${response.statusText}`,
          timestamp: new Date().toISOString(),
          duration,
        };
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        message: `Keep-alive error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get keep-alive service status
   */
  getStatus() {
    return {
      service: 'Keep-Alive Service',
      status: 'Active',
      environment: this.isProduction ? 'production' : 'development',
      enabled: this.isProduction,
      schedule: 'Every 10 minutes',
      target: `${this.backendDomain}/api/health`,
      nextRun: this.getNextCronRun(),
    };
  }

  private getNextCronRun(): string {
    // Calculate next 10-minute interval
    const now = new Date();
    const minutes = now.getMinutes();
    const nextMinutes = Math.ceil(minutes / 10) * 10;
    const next = new Date(now);

    if (nextMinutes === 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    } else {
      next.setMinutes(nextMinutes);
    }

    next.setSeconds(0);
    next.setMilliseconds(0);

    return next.toISOString();
  }
}
