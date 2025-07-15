import { IsString, IsNotEmpty } from 'class-validator';

export class GetFileDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
