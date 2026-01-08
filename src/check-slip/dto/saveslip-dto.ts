import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class SaveSlipDto {
  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsString()
  @IsNotEmpty()
  decode: string;

  @IsString()
  @IsNotEmpty()
  transRef: string;

  @IsString()
  @IsNotEmpty()
  dateTime: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  ref1: string;

  @IsString()
  @IsNotEmpty()
  ref2: string;

  @IsString()
  @IsNotEmpty()
  ref3: string;

  @IsObject()
  @IsOptional()
  receiver?: Record<string, any>;

  @IsObject()
  @IsOptional()
  sender?: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  typeslip: string;
}
