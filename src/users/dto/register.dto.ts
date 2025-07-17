import { IsEmail, IsString, MinLength, IsNotEmpty, IsEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
export class RegisterDto {
  @ApiProperty({
    description: 'Email for registration',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for registration',
    type: String,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Your first name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Your lastname',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Your phone number',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  isAdmin: boolean = false;
}