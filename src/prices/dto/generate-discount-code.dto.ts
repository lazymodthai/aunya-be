import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class GenerateDiscountCodeDto {
  @ApiProperty({
    type: String,
    required: false,
    description: "Discount code (If empty It will generate random code)",
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    type: Number,
    required: false,
    description: "Discount amount",
  })
  @IsOptional()
  @IsNumber()
  discount?: number | null;

  @ApiProperty({
    type: Number,
    required: false,
    description: "Discount percentage",
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number | null;

  @ApiProperty({
    type: Number,
    default: 1,
    required: false,
    description: "Count",
  })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiProperty({
    type: String,
    required: false,
    description: "Expiration date (ISO string, e.g. 2026-12-31T23:59:59.999Z)",
  })
  @IsOptional()
  expiresAt?: string | null;
}
