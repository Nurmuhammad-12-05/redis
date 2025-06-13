import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../core/database/redis.service';
import { generate } from 'otp-generator';
import { SmsService } from './sms.service';
import { OtpSecurityService } from './otp.security.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly smsService: SmsService,
    private readonly otpSecurityService: OtpSecurityService,
  ) {}

  private generateOtp() {
    const otp = generate(6, {
      digits: true,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    return otp;
  }

  private getSessionToken() {
    const token = crypto.randomUUID();

    return token;
  }

  async sendOtp(phone_number: string) {
    await this.otpSecurityService.checkIfTemporaryBlockedUser(phone_number);

    await this.checkOtpExisted(`user:${phone_number}`);

    const tempOtp = this.generateOtp();

    const response = await this.redisService.setOtp(phone_number, tempOtp);

    if (response === 'OK') {
      await this.smsService.sendSms(phone_number, tempOtp);
      return true;
    }
  }

  async checkOtpExisted(key: string) {
    const checkOtp = await this.redisService.getOtp(key);

    if (checkOtp) {
      const ttl = await this.redisService.getTtlKey(key);

      throw new BadRequestException(`Please try again after ${ttl} seconds`);
    }
  }

  async verifyOtpSendUser(key: string, code: string, phone_number: string) {
    await this.otpSecurityService.checkIfTemporaryBlockedUser(phone_number);

    const otp = await this.redisService.getOtp(key);

    if (!otp) {
      throw new BadRequestException('Invalid code');
    }

    if (otp !== code) {
      const attempts =
        await this.otpSecurityService.recordFailedOtpAttempts(phone_number);

      throw new BadRequestException({
        message: 'Invalid code',
        attempts: `You have ${attempts} attempts `,
      });
    }

    await this.redisService.delKey(key);

    await this.otpSecurityService.delOtpAttempts(
      `otp_attempts:${phone_number}`,
    );

    const sessionToken = this.getSessionToken();

    await this.redisService.sessionTokenUser(phone_number, sessionToken);

    return sessionToken;
  }

  async checkSessionTokenUser(key: string, token: string) {
    const sessionToken: string = (await this.redisService.getKey(
      key,
    )) as string;

    if (!sessionToken || sessionToken !== token)
      throw new BadRequestException('session token expired');
  }

  async delSessionTokenUser(key: string) {
    await this.redisService.delKey(key);
  }
}
