import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookDto } from './dto/book.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags("Booking")
@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post("/book")
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Book a room",
    description: "Book a room",
  })
  @ApiBody({
    type: BookDto,
    description: "Booking data",
  })
  async book(@Body() bookDto: BookDto) {
    const result = await this.bookingService.createBooking(bookDto);
    return {
      message: "Booking successful",
      ...result,
    };
  }

  @Get("/dates")
  @ApiOperation({
    summary: "Get all dates",
    description: "Get all dates",
  })
  @HttpCode(HttpStatus.OK)
  async getAllDate() {
    return await this.bookingService.getAllDate();
  }

  @Get("/booked")
  @ApiOperation({
    summary: "Get booked rooms",
    description: "Get booked rooms",
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRooms() {
    return await this.bookingService.getAllBookedRooms();
  }

}
