import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateEmailVerifycationLinkDto } from './dto/create.email.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/create-user-email/:id')
  async createUserEmail(
    @Body() createEmailVerifycationLinkDto: CreateEmailVerifycationLinkDto,
    @Param('id') id: string,
  ) {
    return await this.usersService.createUserEmail(
      createEmailVerifycationLinkDto,
      id,
    );
  }

  @Post('/email/send-verifycation-link')
  @HttpCode(200)
  async sendEmailVerifycationLink(@Body('email') email: string) {
    return await this.usersService.sendEmailVerifycationLink(email);
  }

  @Get('/user/verify-email')
  async verifyEmailUser(@Query('token') token: string) {
    return await this.usersService.verifyEmailUser(token);
  }
}
