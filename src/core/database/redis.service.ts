import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  public redis: Redis;
  private duration: number = 60;

  constructor() {
    this.redis = new Redis({
      port: +(process.env.REDIS_PORT as string),
      host: process.env.REDIS_HOST as string,
    });

    this.redis.on('connect', () => {
      console.log('Redis connected');
    });

    this.redis.on('error', (err) => {
      console.log('Redis connecting error: ', err);
      this.redis.quit();
      process.exit(1);
    });
  }

  async setOtp(phone_number: string, otp: string): Promise<string> {
    const key = `user:${phone_number}`;

    const result = await this.redis.setex(key, this.duration, otp);

    return result;
  }

  async getOtp(key: string) {
    const otp = await this.redis.get(key);

    return otp;
  }

  async getTtlKey(key: string) {
    const ttl = await this.redis.ttl(key);

    return ttl;
  }

  async delKey(key: string) {
    await this.redis.del(key);
  }
}
