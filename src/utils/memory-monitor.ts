import { Logger } from '@nestjs/common';

export class MemoryMonitor {
  private static readonly logger = new Logger('MemoryMonitor');
  private static interval: NodeJS.Timeout | null = null;

  static start(intervalMs = 30000) {
    if (process.env.NODE_ENV === 'production') {
      this.interval = setInterval(() => {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const rssMB = Math.round(usage.rss / 1024 / 1024);

        // Only log if memory usage is concerning
        if (heapUsedMB > 200 || rssMB > 400) {
          this.logger.warn(
            `Memory usage: Heap ${heapUsedMB}MB/${heapTotalMB}MB, RSS ${rssMB}MB`,
          );
        }
      }, intervalMs);
    }
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  static getCurrentUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };
  }
}
