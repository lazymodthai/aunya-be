import { Controller, Post, Body, UsePipes, ValidationPipe, Patch, Param } from '@nestjs/common';
import { PricesService } from './prices.service';
import { GeneratePriceDto } from './dto/generate-price.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { GenerateDiscountCodeDto } from './dto/generate-discount-code.dto';
import { GetPriceByMonthDto } from './dto/get-price-by-month.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { ResetPriceDto } from './dto/reset-price.dto';

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

  @Patch(':id/price')
  @ApiOperation({
    summary: "Update price by id",
    description: "Update price by id",
  })
  @ApiParam({ name: 'id', description: 'Price calendar ID' })
  @ApiBody({
    type: UpdatePriceDto,
    description: "Update price data",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updatePrice(@Param('id') id: string, @Body() updatePriceDto: UpdatePriceDto) {
    return this.pricesService.updatePrice(id, updatePriceDto);
  }

  @Patch(':id/maintenance')
  @ApiOperation({
    summary: "Update maintenance status by id",
    description: "Update maintenance status by id",
  })
  @ApiParam({ name: 'id', description: 'Price calendar ID' })
  @ApiBody({
    type: UpdateMaintenanceDto,
    description: "Update maintenance data",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateMaintenance(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.pricesService.updateMaintenance(id, updateMaintenanceDto);
  }

  @Post('reset')
  @ApiOperation({
    summary: "Reset prices by year and room",
    description: "ลบข้อมูลราคาทั้งหมดของห้องและปีที่ระบุ เพื่อ generate ใหม่",
  })
  @ApiBody({
    type: ResetPriceDto,
    description: "Reset price data",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  resetPrices(@Body() resetPriceDto: ResetPriceDto) {
    return this.pricesService.resetPrices(resetPriceDto);
  }
}