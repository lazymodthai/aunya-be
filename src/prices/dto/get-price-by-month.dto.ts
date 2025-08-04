import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class GetPriceByMonthDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: "Which month to get prices",
  })
  @IsNumber()
  month: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: "Which year get prices",
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    type: String,
    required: true,
    description: "Room ID",
  })
  @IsString()
  roomId: string;
}
