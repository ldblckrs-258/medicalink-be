import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { KeepAliveService } from './keep-alive.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('KeepAliveService', () => {
  let service: KeepAliveService;

  const mockConfigService = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepAliveService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KeepAliveService>(KeepAliveService);

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockConfigService.get.mockReturnValue('development');
    mockConfigService.getOrThrow.mockReturnValue('http://localhost:3000');
  });

  describe('getStatus', () => {
    it('should return service status in production', () => {
      // Override for this test
      mockConfigService.get.mockReturnValue('production');
      mockConfigService.getOrThrow.mockReturnValue('https://example.com');

      const status = service.getStatus();

      expect(status.service).toBe('Keep-Alive Service');
      expect(status.status).toBe('Active');
      expect(status.environment).toBe('production');
      expect(status.enabled).toBe(true);
      expect(status.schedule).toBe('Every 10 minutes');
      expect(status.target).toBe('https://example.com/api/health');
    });

    it('should show disabled in development', () => {
      // Use default mock values (development)
      const status = service.getStatus();

      expect(status.environment).toBe('development');
      expect(status.enabled).toBe(false);
      expect(status.target).toBe('http://localhost:3000/api/health');
    });
  });

  describe('triggerKeepAlive', () => {
    beforeEach(() => {
      // Override for trigger tests
      mockConfigService.getOrThrow.mockReturnValue('https://example.com');
    });

    it('should return success on successful request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ status: 'OK' }),
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.triggerKeepAlive();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Keep-alive successful: 200');
      expect(result.duration).toBeDefined();
    });

    it('should return failure on unsuccessful request', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.triggerKeepAlive();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Keep-alive failed: 500');
    });

    it('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await service.triggerKeepAlive();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Keep-alive error: Network error');
    });
  });

  describe('handleKeepAlive', () => {
    it('should skip in development environment', async () => {
      // Use default mock (development)
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      await service.handleKeepAlive();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Keep-alive skipped: Not in production environment',
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make request in production environment', async () => {
      // Override for this test
      mockConfigService.get.mockReturnValue('production');
      mockConfigService.getOrThrow.mockReturnValue('https://example.com');

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: 'OK',
          timestamp: '2025-09-07T10:00:00.000Z',
        }),
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.handleKeepAlive();

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/api/health',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'User-Agent': 'MedicaLink-KeepAlive/1.0',
            'X-Keep-Alive': 'true',
          },
        }),
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Keep-alive successful: 200 in \d+ms/),
      );
    });
  });
});
