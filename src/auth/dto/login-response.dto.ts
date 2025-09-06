import { StaffAccount } from '../../staff-accounts/domain/staff-account';

export class LoginResponseDto {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: StaffAccount;
}
