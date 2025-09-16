import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GenerateDiscountCodeDto {
  @ApiProperty({
    type: String,
    required: false,
    description: "Discount code (If empty It will generate random code)",
  })
  @Optional()
  @IsString()
  code?: string;

  @ApiProperty({
    type: Number,
    required: false,
    description: "Discount amount",
  })
  @Optional()
  discount: number | null;

  @ApiProperty({
    type: Number,
    required: false,
    description: "Discount percentage",
  })
  @Optional()
  discountPercentage: number | null;

  @ApiProperty({
    type: Number,
    default: 1,
    required: false,
    description: "Count",
  })
  @Optional()
  count: number;
}
