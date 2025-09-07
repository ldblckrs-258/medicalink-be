import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let staffAccountsService: StaffAccountsService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: StaffAccountsService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            staffAccount: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-secret'),
            getOrThrow: jest.fn().mockReturnValue('mock-secret'),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setSession: jest.fn(),
            getSession: jest.fn(),
            deleteSession: jest.fn(),
            blacklistToken: jest.fn(),
            isTokenBlacklisted: jest.fn(),
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    staffAccountsService =
      module.get<StaffAccountsService>(StaffAccountsService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have staff accounts service injected', () => {
    expect(staffAccountsService).toBeDefined();
  });
});
