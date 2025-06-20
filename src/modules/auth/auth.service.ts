import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAuthDto } from './dto/create.auth.dto';
import { OtpService } from './otp.service';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { RegisterAuthDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginPhoneAndPasswordDto } from './dto/login.phone.password.dto';
import { LoginPhoneNumberDto } from './dto/login.phone.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwtService: JwtService,
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

    const sessionToken = await this.otpService.verifyOtpSendUser(
      key,
      verifyOtpDto.code,
      verifyOtpDto.phone_number,
    );

    return {
      message: 'success',
      statusCode: 200,
      session_token: sessionToken,
    };
  }

  async register(registerAuthDto: RegisterAuthDto) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        phone_number: registerAuthDto.phone_number,
      },
    });

    if (findUser) throw new ConflictException('phone_number already exists.');

    const key = `session_token:${registerAuthDto.phone_number}`;

    await this.otpService.checkSessionTokenUser(
      key,
      registerAuthDto.session_token,
    );

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

    const token = await this.jwtService.signAsync({ userId: user.id });

    await this.otpService.delSessionTokenUser(key);

    return token;
  }

  async loginWithPhoneAndPassword(
    loginhoneAndPassword: LoginPhoneAndPasswordDto,
  ) {
    const findUser = await this.db.prisma.user.findFirst({
      where: { phone_number: loginhoneAndPassword.phone_number },
    });

    if (!findUser)
      throw new ConflictException('Invalid phone number or password');

    const comparePassword = await bcrypt.compare(
      loginhoneAndPassword.password,
      findUser.password,
    );

    if (!comparePassword)
      throw new ConflictException('invalid phone number or password');

    await this.otpService.sendOtp(loginhoneAndPassword.phone_number);

    return {
      message: 'code sended',
    };
  }

  async loginCode(verifyOtpDto: VerifyOtpDto) {
    const key = `user:${verifyOtpDto.phone_number}`;

    await this.otpService.verifyOtpSendUser(
      key,
      verifyOtpDto.code,
      verifyOtpDto.phone_number,
    );

    await this.otpService.delSessionTokenUser(key);

    const user = await this.db.prisma.user.findFirst({
      where: {
        phone_number: verifyOtpDto.phone_number,
      },
    });

    const token = await this.jwtService.signAsync({ userId: user?.id });

    return token;
  }

  async loginWithPhoneNumber(loginPhoneNumberDto: LoginPhoneNumberDto) {
    const findUser = await this.db.prisma.user.findFirst({
      where: { phone_number: loginPhoneNumberDto.phone_number },
    });

    if (!findUser)
      throw new ConflictException('Invalid phone number or password');

    await this.otpService.sendOtp(loginPhoneNumberDto.phone_number);

    return {
      message: 'code sended',
    };
  }
}
