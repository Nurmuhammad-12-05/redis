import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from 'src/modules/auth/otp.service';
import { SmsService } from './sms.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OtpService, SmsService],
})
export class AuthModule {}
