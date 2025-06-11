import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MaxLength(20)
  @MinLength(10)
  phone_number: string;

  @IsString()
  @MaxLength(4)
  @MinLength(4)
  code: string;
}
