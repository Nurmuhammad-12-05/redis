import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../core/database/redis.service';
import { generate } from 'otp-generator';
import { SmsService } from './sms.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly smsService: SmsService,
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
    const otp = await this.redisService.getOtp(key);

    if (!otp || otp !== code) throw new BadRequestException('Invalid code');

    await this.redisService.delKey(key);

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

    await this.redisService.delKey(key);
  }
}
