import { IsEmail, IsString, MinLength, IsNotEmpty, IsEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  isAdmin: boolean = false;
}