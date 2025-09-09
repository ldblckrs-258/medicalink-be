import { Test, TestingModule } from '@nestjs/testing';
import { StaffAccountRepository } from './repositories';
import { StaffAccountsService } from './staff-accounts.service';

describe('StaffAccountsService', () => {
  let service: StaffAccountsService;
  let repository: StaffAccountRepository;
  let module: TestingModule;

  const mockRepository = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findByEmail: jest.fn(),
    findByRole: jest.fn(),
    findAllWithFilters: jest.fn(),
    countWithFilters: jest.fn(),
    countByRole: jest.fn(),
    findDeletedAccounts: jest.fn(),
    getStatistics: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    adminResetPassword: jest.fn(),
    adminDelete: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        StaffAccountsService,
        {
          provide: 'StaffAccountRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StaffAccountsService>(StaffAccountsService);
    repository = module.get<StaffAccountRepository>('StaffAccountRepository');
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have repository injected', () => {
    expect(repository).toBeDefined();
  });
});
