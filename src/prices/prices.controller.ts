import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { PricesService } from './prices.service';
import { GeneratePriceDto } from './dto/generate-price.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { GenerateDiscountCodeDto } from './dto/generate-discount-code.dto';
import { GetPriceByMonthDto } from './dto/get-price-by-month.dto';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Post('generate')
  @ApiOperation({
    summary: "Generate prices",
    description: "Generate prices for a room",
  })
  @ApiBody({
    type: GeneratePriceDto,
    description: "Generate price data",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  generatePrice(@Body() generatePriceDto: GeneratePriceDto) {
    return this.pricesService.generatePrices(generatePriceDto);
  }

  @Post('generate-discount-code')
  @ApiOperation({
    summary: "Generate discount code",
    description: "Generate discount code",
  })
  @ApiBody({
    type: GenerateDiscountCodeDto,
    description: "Generate discount code",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  generateDiscountCode(@Body() generateDiscountCode: GenerateDiscountCodeDto) {
    return this.pricesService.generateDiscountCode(generateDiscountCode);
  }

  @Post('get-price-by-month')
  @ApiOperation({
    summary: "Get price by month",
    description: "Get price by month",
  })
  getPriceByMonth(@Body() getPriceByMonth: GetPriceByMonthDto) {
    return this.pricesService.getPriceByMonth(getPriceByMonth);
  }

}