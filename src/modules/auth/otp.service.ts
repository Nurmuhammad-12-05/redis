import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../../core/database/redis.service';
import { generate } from 'otp-generator';

@Injectable()
export class OtpService {
  constructor(private readonly redisService: RedisService) {}

  private generateOtp() {
    const otp = generate(4, {
      digits: true,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    return otp;
  }

  async sendOtp(phone_number: string) {
    await this.checkOtpExisted(`user:${phone_number}`);

    const tempOtp = this.generateOtp();

    const response = await this.redisService.setOtp(phone_number, tempOtp);

    if (response === 'OK') {
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

  async verifyOtpSendUser(key: string, code: string) {
    const otp = await this.redisService.getOtp(key);

    if (!otp || otp !== code) throw new BadRequestException('Invalid code');

    await this.redisService.delKey(key);
  }
}
