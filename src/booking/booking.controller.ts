import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { BookingService } from "./booking.service";
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiOkResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { BookDto } from "./dto/book.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";
import { BookingStatus } from "@/constants/booking.enum";
import { AdminOnly, UserOnly } from "@/auth/decorators";
import { UpdateBookingRemarkDto } from "./dto/update-booking-remark.dto";
import { UpdateBookingDto } from "./dto/update-booking.dto";
// import { FilesService } from "@src/files/files.service";

@ApiTags("Booking")
@Controller("booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService,
  ) { }


  @Post("/book")
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

  @Get("/disabled-dates")
  @ApiOperation({
    summary: "Get disabled dates",
    description: "Get disabled dates",
  })
  @HttpCode(HttpStatus.OK)
  async getDisabledDates() {
    return await this.bookingService.getDisabledDates();
  }

  @Get("/booked/all")
  @AdminOnly()
  @ApiOperation({
    summary: "get all",
    description: "get all booked rooms with files (QR codes and payment slips)",
  })
  @ApiQuery({
    name: "status",
    description: "Filter by booking status",
    required: false,
    enum: BookingStatus,
  })
  @HttpCode(HttpStatus.OK)
  async getAllBookedRooms(@Query() query: { status?: BookingStatus }) {
    return await this.bookingService.getAllBookRoomsWithFiles({
      status: query.status,
    });
  }

  @Get("/booked")
  @AdminOnly()
  @ApiOperation({
    summary: "Get booked rooms",
    description: "Get booked rooms",
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRooms() {
    return await this.bookingService.getAllBookedRooms();
  }

  @Get("/find")
  @AdminOnly()
  @ApiOperation({
    summary: "Get booked data by reference code",
    description: "Retrieve booking information using reference code",
  })
  @ApiQuery({
    name: "refCode",
    description: "Booking reference code",
    type: "string",
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRoom(@Query("refCode") refCode: string) {
    if (!refCode) {
      throw new BadRequestException("refCode is required");
    }

    try {
      const booking = await this.bookingService.getBookedRoom(refCode);

      if (!booking) {
        throw new NotFoundException(
          `Booking with refCode '${refCode}' not found`
        );
      }

      return {
        success: true,
        data: booking,
        message: "Booking retrieved successfully",
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to retrieve booking");
    }
  }

  @Get("/find-by-phone")
  @AdminOnly()
  @ApiOperation({
    summary: "Get booked data by phone number",
    description: "Retrieve booking information using phone number",
  })
  @ApiQuery({
    name: "phoneNumber",
    description: "Booking phone number",
    type: "string",
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  async getBookedRoomByPhoneNumber(@Query("phoneNumber") phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException("Phone number is required");
    }

    try {
      const bookings =
        await this.bookingService.getBookedRoomsByPhoneNumber(phoneNumber);

      if (!bookings || !bookings.length) {
        throw new NotFoundException(
          `Booking with phone number '${phoneNumber}' not found`
        );
      }

      return {
        success: true,
        data: bookings,
        message: "Booking retrieved successfully",
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to retrieve booking");
    }
  }

  @Get("/find-by-date")
  @AdminOnly()
  @ApiOperation({
    summary: "Get bookings by date",
    description: "Retrieve bookings that include the specified date",
  })
  @ApiQuery({
    name: "date",
    description: "Date to search (format: YYYY-MM-DD)",
    type: "string",
    required: true,
    example: "2026-12-02",
  })
  @ApiQuery({
    name: "status",
    description: "Filter by booking status (optional, if not specified returns all)",
    required: false,
    enum: BookingStatus,
  })
  @HttpCode(HttpStatus.OK)
  async getBookingsByDate(
    @Query("date") date: string,
    @Query("status") status?: BookingStatus
  ) {
    if (!date) {
      throw new BadRequestException("Date is required");
    }

    try {
      const bookings = await this.bookingService.getBookingsByDate(date, status);

      return {
        success: true,
        data: bookings,
        message: "Bookings retrieved successfully",
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to retrieve bookings");
    }
  }

  @Get("/my-bookings")
  @UserOnly()
  @ApiOperation({
    summary: "Get all bookings for current user",
    description: "Retrieve all bookings for the currently logged in user based on phone number",
  })
  @ApiQuery({
    name: "status",
    description: "Filter by booking status (optional)",
    required: false,
    enum: BookingStatus,
  })
  @ApiOkResponse({
    description: "Bookings retrieved successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              refCode: { type: "string" },
              checkinDate: { type: "string" },
              checkoutDate: { type: "string" },
              status: { type: "string" },
            },
          },
        },
        message: { type: "string", example: "Bookings retrieved successfully" },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "User not authenticated",
  })
  @HttpCode(HttpStatus.OK)
  async getMyBookings(
    @Request() req,
    @Query("status") status?: BookingStatus
  ) {
    try {
      const id = req.user.id;
      const phoneNumber = req.user.phoneNumber;
      const bookings = await this.bookingService.getBookingsByCustomer(id, phoneNumber, status);

      return {
        success: true,
        data: bookings,
        message: "Bookings retrieved successfully",
      };
    } catch (error) {
      throw new InternalServerErrorException("Failed to retrieve bookings");
    }
  }

  @Patch(":id/status")
  @ApiOperation({
    summary: "Update booking status by ID",
    description: "Update the status of a booking",
  })
  @ApiParam({ name: "id", description: "Booking ID (UUID)" })
  @ApiBody({
    type: UpdateBookingStatusDto,
    description: "New booking status",
  })
  @ApiOkResponse({
    description: "Booking status updated successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "อัปเดตสถานะการจองสำเร็จ" },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateBookingStatus(
    @Param("id") id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto
  ) {
    return this.bookingService.updateBookingStatus(
      id,
      updateBookingStatusDto.status,
      updateBookingStatusDto.additionalPayment,
      updateBookingStatusDto.remark
    );
  }

  @Patch(":id/remark")
  @ApiOperation({
    summary: "Update booking remark by ID",
    description: "Update the remark of a booking",
  })
  @ApiParam({ name: "id", description: "Booking ID (UUID)" })
  @ApiBody({
    type: UpdateBookingRemarkDto,
    description: "New booking remark",
  })
  @ApiOkResponse({
    description: "Booking remark updated successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "อัปเดตหมายเหตุการจองสำเร็จ" },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateBookingRemark(
    @Param("id") id: string,
    @Body() updateBookingRemarkDto: UpdateBookingRemarkDto
  ) {
    return this.bookingService.updateBookingRemark(id, updateBookingRemarkDto.remark);
  }

  @Patch(":id")
  @AdminOnly()
  @ApiOperation({
    summary: "Update booking information by ID",
    description: "Update various fields of a booking",
  })
  @ApiParam({ name: "id", description: "Booking ID (UUID)" })
  @ApiBody({
    type: UpdateBookingDto,
    description: "Booking data to update",
  })
  @ApiOkResponse({
    description: "Booking updated successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string", example: "อัปเดตข้อมูลการจองสำเร็จ" },
        data: { type: "object" },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateBooking(
    @Param("id") id: string,
    @Body() updateBookingDto: UpdateBookingDto
  ) {
    const result = await this.bookingService.updateBooking(id, updateBookingDto);
    return {
      success: true,
      message: "อัปเดตข้อมูลการจองสำเร็จ",
      data: result,
    };
  }

  @Get("/summary")
  @AdminOnly()
  @ApiOperation({
    summary: "Get booking summary",
    description: "Get detailed summary of bookings, revenue, and guest counts by month and year",
  })
  @ApiQuery({
    name: "year",
    description: "Year to get summary for (optional, defaults to current year)",
    required: false,
    type: Number,
  })
  @HttpCode(HttpStatus.OK)
  async getSummary(@Query("year") year?: string) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return await this.bookingService.getSummary(yearNum);
  }
}
