import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { RedisService } from 'src/core/database/redis.service';
import { CreateAuthDto } from './dto/create.auth.dto';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { RegisterAuthDto } from './dto/register.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
  ) {}

  async sendOtpUser(createAuthDto: CreateAuthDto) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number: createAuthDto.phone_number,
      },
    });

    if (findUser) throw new ConflictException('phone_number already exists.');

    const phoneNumber = createAuthDto.phone_number;

    const res = await this.otpService.sendOtp(phoneNumber);

    if (!res) throw new InternalServerErrorException('Server error.');

    return {
      message: 'code sended',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const key = `user:${verifyOtpDto.phone_number}`;

    await this.otpService.verifyOtpSendUser(key, verifyOtpDto.code);

    return {
      message: 'success',
      statusCode: 200,
    };
  }

  async register(registerAuthDto: RegisterAuthDto) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number: registerAuthDto.phone_number,
      },
    });

    if (findUser) throw new ConflictException('phone_number already exists.');

    const hashPassword = await bcrypt.hash(registerAuthDto.password, 12);

    const user = await this.db.prisma.user.create({
      data: {
        phone_number: registerAuthDto.phone_number,
        password: hashPassword,
      },
      select: {
        id: true,
        phone_number: true,
      },
    });

    return user;
  }

  async login() {}
}
