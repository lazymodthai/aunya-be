import { IsString, IsOptional } from 'class-validator';

export class ListFilesDto {
  @IsString()
  @IsOptional()
  prefix?: string;
}
