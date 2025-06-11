import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @MaxLength(20)
  @MinLength(10)
  phone_number: string;
}
