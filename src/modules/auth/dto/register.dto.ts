import {
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterAuthDto {
  @IsString()
  @MaxLength(20)
  @MinLength(10)
  phone_number: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  session_token: string;
}
