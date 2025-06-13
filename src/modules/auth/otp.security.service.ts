import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from 'src/core/database/redis.service';

@Injectable()
export class OtpSecurityService {
  private readonly maxAttempsOtp: number = 3;
  private readonly blockedDuration: number = 3600;
  private readonly otpAttemptsDuration: number = 1050;

  constructor(private readonly redisService: RedisService) {}

  async recordFailedOtpAttempts(phone_number: string) {
    const key = `otp_attempts:${phone_number}`;

    const checkExistsKey = await this.redisService.redis.exists(key);

    if (!checkExistsKey) {
      await this.redisService.redis.incr(key);
      await this.redisService.redis.expire(key, this.otpAttemptsDuration);
    } else {
      await this.redisService.redis.incr(key);
    }

    const attempts = +((await this.redisService.getKey(key)) as string);

    const res = this.maxAttempsOtp - attempts;

    if (res === 0) await this.TemporaryBlockUser(phone_number, attempts);

    return res;
  }

  async TemporaryBlockUser(phone_number: string, attempts: number) {
    const key = `temporary_blocked_user:${phone_number}`;

    const data = Date.now();

    await this.redisService.redis.setex(
      key,
      this.blockedDuration,
      JSON.stringify({
        blockedAt: data,
        attempts,
        reason: `To many attempts`,
        unblockedAt: data + this.blockedDuration * 1000,
      }),
    );

    await this.delOtpAttempts(`otp_attempts:${phone_number}`);
  }

  async checkIfTemporaryBlockedUser(phone_number: string) {
    const key = `temporary_blocked_user:${phone_number}`;

    const data = await this.redisService.getKey(key);

    if (data) {
      const ttlKey = await this.redisService.getTtlKey(key);

      throw new BadRequestException({
        message: `You tried  too much, please try after ${Math.floor(ttlKey / 60)} minutes`,
      });
    }
  }

  async delOtpAttempts(key: string) {
    await this.redisService.delKey(key);
  }
}
