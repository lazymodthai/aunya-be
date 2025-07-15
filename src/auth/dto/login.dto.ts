import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: 'Your email',
    type: String,
    format: 'email'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Your password',
    type: String,
    minLength: 1
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}