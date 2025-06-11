import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create.auth.dto';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { Response } from 'express';
import { RegisterAuthDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/send-otp')
  async sendOtpUser(@Body() createAuthDto: CreateAuthDto) {
    const response = await this.authService.sendOtpUser(createAuthDto);

    return response;
  }

  @Post('/verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('/register')
  async register(@Body() registerAuthDto: RegisterAuthDto) {
    const response = await this.authService.register(registerAuthDto);

    return response;
  }

  @Post('/login')
  async login() {}
}
