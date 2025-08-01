import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { PricesService } from './prices.service';
import { GeneratePriceDto } from './dto/generate-price.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

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
}