import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
  @ApiProperty({
    description: 'Email for registration',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for registration',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Your name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Your lastname',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}