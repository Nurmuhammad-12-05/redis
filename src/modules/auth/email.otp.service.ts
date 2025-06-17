import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';
import { OtpService } from './otp.service';
import { RedisService } from 'src/core/database/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailOtpService {
  private readonly MAX_DURATION_LINK: number = 86400;

  constructor(
    private readonly resendService: ResendService,
    private readonly otpService: OtpService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmailLink(email: string) {
    const token = this.otpService.getSessionToken();

    await this.setEmailToken(token, email);

    const fromEmail = this.configService.get('HOST_EMAIL') as string;

    const url = `http://${this.configService.get('HOST_EMAIL_URL') as string}:4000/api/user/verify-email?token=${token}`;

    try {
      await this.resendService.send({
        from: fromEmail,
        to: email,
        subject: 'Hello Word',
        html: `<a href=${url}>Tasdiqlash</a>`,
      });

      return token;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async setEmailToken(token: string, email: string) {
    const key = `email-verify:${token}`;

    await this.redisService.redis.setex(
      key,
      this.MAX_DURATION_LINK,
      JSON.stringify({
        email,
        createAt: new Date(),
      }),
    );
  }

  async getEmailToken(token: string) {
    const key = `email-verify:${token}`;

    return await this.redisService.getKey(key);
  }
}
