import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailOtpService } from '../auth/email.otp.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateEmailVerifycationLinkDto } from './dto/create.email.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly emailOtpService: EmailOtpService,
    private readonly db: PrismaService,
  ) {}

  async createUserEmail(
    createEmailVerifycationLinkDto: CreateEmailVerifycationLinkDto,
    id: string,
  ) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        id: +id,
      },
    });

    if (!findUser) throw new NotFoundException('User not found');

    const udateUser = await this.db.prisma.user.update({
      where: { id: +id },
      data: {
        ...createEmailVerifycationLinkDto,
      },
      select: {
        id: true,
        phone_number: true,
        email: true,
        is_phone_verified: true,
        is_email_verified: true,
      },
    });

    return udateUser;
  }

  async sendEmailVerifycationLink(email: string) {
    const findUser = await this.db.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!findUser) throw new BadRequestException('Email not found');

    const token = await this.emailOtpService.sendEmailLink(email);

    return {
      message: 'sended',
      token,
    };
  }

  async verifyEmailUser(token: string) {
    const data = await this.emailOtpService.getEmailToken(token);

    const response = JSON.parse(data as string);

    const user = await this.db.prisma.user.findFirst({
      where: { email: response.email },
    });

    await this.db.prisma.user.update({
      where: {
        id: user?.id,
      },
      data: {
        is_email_verified: true,
      },
    });

    return `<h1>Email mofaqyatli tasdiqlandi</h1>`;
  }
}
