import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAuth() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: 'Test api endpoint successfully',
        });
      }, 1000);
    });
  }
}
