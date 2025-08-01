import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class GeneratePriceDto {
  @IsNumber()
  @IsPositive()
  weekdayPrice: number;

  @IsNumber()
  @IsPositive()
  weekendPrice: number;

  @IsNumber()
  @IsPositive()
  holidayPrice: number;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}