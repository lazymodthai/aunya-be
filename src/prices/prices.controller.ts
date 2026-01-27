import { Controller, Post, Body, UsePipes, ValidationPipe, Patch, Param, Get } from '@nestjs/common';
import { PricesService } from './prices.service';
import { GeneratePriceDto } from './dto/generate-price.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { GenerateDiscountCodeDto } from './dto/generate-discount-code.dto';
import { GetPriceByMonthDto } from './dto/get-price-by-month.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { ResetPriceDto } from './dto/reset-price.dto';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { AdminOnly } from '@src/auth/decorators';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) { }

  @Post('generate')
  @AdminOnly()
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
  @AdminOnly()
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
  @AdminOnly()
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
  @AdminOnly()
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
  @AdminOnly()
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

  @Get('discount-codes')
  @AdminOnly()
  @ApiOperation({
    summary: "Get all discount codes",
    description: "ดึงข้อมูล discount codes ทั้งหมด",
  })
  getAllDiscountCodes() {
    return this.pricesService.getAllDiscountCodes();
  }

  @Get('discount-codes/:code')
  @ApiOperation({
    summary: "Get discount by code",
    description: "ดึงข้อมูล discount code ตาม code ที่ระบุ",
  })
  @ApiParam({ name: 'code', description: 'Discount code' })
  getDiscountByCode(@Param('code') code: string) {
    return this.pricesService.getDiscountByCode(code);
  }

  @Post('discount-codes/:code/use')
  @ApiOperation({
    summary: "Use discount code",
    description: "ใช้ discount code (ลด count ลง 1)",
  })
  @ApiParam({ name: 'code', description: 'Discount code' })
  useDiscountCode(@Param('code') code: string) {
    return this.pricesService.useDiscountCode(code);
  }

  @Post('calculate')
  @ApiOperation({
    summary: "Calculate price for date range",
    description: "คำนวณราคารวมสำหรับช่วงวันที่ checkin - checkout (ไม่รวมวัน checkout)",
  })
  @ApiBody({
    type: CalculatePriceDto,
    description: "Calculate price data",
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  calculatePrice(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.pricesService.calculatePrice(calculatePriceDto);
  }
}