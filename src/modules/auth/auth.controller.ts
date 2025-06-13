import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create.auth.dto';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { Response } from 'express';
import { RegisterAuthDto } from './dto/register.dto';
import { LoginPhoneAndPasswordDto } from './dto/login.phone.password.dto';
import { LoginPhoneNumberDto } from './dto/login.phone.dto';

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
  async register(
    @Body() registerAuthDto: RegisterAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.register(registerAuthDto);

    res.cookie('token', token, {
      maxAge: 1.1 * 3600 * 1000,
      httpOnly: true,
    });

    return { token };
  }

  @Post('/login-phone-password')
  async loginWithPhoneAndPassword(
    @Body() loginhoneAndPassword: LoginPhoneAndPasswordDto,
  ) {
    const response =
      await this.authService.loginWithPhoneAndPassword(loginhoneAndPassword);

    return response;
  }

  @Post('/login-check-code')
  async loginCode(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.loginCode(verifyOtpDto);

    res.cookie('token', token, {
      maxAge: 1.1 * 3600 * 1000,
      httpOnly: true,
    });

    return { token };
  }

  @Post('/login-phone-number')
  async loginWithPhoneNumber(@Body() loginPhoneNumberDto: LoginPhoneNumberDto) {
    const response =
      await this.authService.loginWithPhoneNumber(loginPhoneNumberDto);

    return response;
  }
}
