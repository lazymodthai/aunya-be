import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BookDto } from './dto/book.dto';

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

  @Get("/find")
  @ApiOperation({
    summary: "Get booked data by reference code",
    description: "Retrieve booking information using reference code",
  })
  @ApiQuery({
    name: 'refCode',
    description: 'Booking reference code',
    type: 'string',
    required: true
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRoom(@Query('refCode') refCode: string) {
    if (!refCode) {
      throw new BadRequestException('refCode is required');
    }

    try {
      const booking = await this.bookingService.getBookedRoom(refCode);
      
      if (!booking) {
        throw new NotFoundException(`Booking with refCode '${refCode}' not found`);
      }
      
      return {
        success: true,
        data: booking,
        message: 'Booking retrieved successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve booking');
    }
  }

  @Get("/find-by-phone")
  @ApiOperation({
    summary: "Get booked data by phone number",
    description: "Retrieve booking information using phone number",
  })
  @ApiQuery({
    name: 'phoneNumber',
    description: 'Booking phone number',
    type: 'string',
    required: true
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRoomByPhoneNumber(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    try {
      const bookings = await this.bookingService.getBookedRoomsByPhoneNumber(phoneNumber);
      
      if (!bookings || !bookings.length) {
        throw new NotFoundException(`Booking with phone number '${phoneNumber}' not found`);
      }
      
      return {
        success: true,
        data: bookings,
        message: 'Booking retrieved successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve booking');
    }
  }
}
