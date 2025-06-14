import { IsEmail, IsString } from 'class-validator';

export class CreateEmailVerifycationLinkDto {
  @IsString()
  @IsEmail()
  email: string;
}
