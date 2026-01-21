import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThan, LessThanOrEqual, MoreThan, Repository } from "typeorm";
import { BookDto } from "./dto/book.dto";
import { BookingStatus } from "@/constants/booking.enum";
import { BookingEntity } from "@/entities/booking.entity";
import { PriceCalendarEntity } from "entities/price-calendar.entity";

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PriceCalendarEntity)
    private readonly pricesRepository: Repository<PriceCalendarEntity>
  ) { }

  private generateRefCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    const randomNum = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");

    return `AY${year}${month}${day}${randomNum}`;
  }

  private async checkAvailableRoom(
    checkinDate: Date,
    checkoutDate: Date,
    roomId: string
  ): Promise<boolean> {
    if (!checkinDate || !checkoutDate || !roomId) {
      return true;
    }

    const conflictingBooking = await this.bookingRepository.findOne({
      where: {
        roomId: roomId,
        status: BookingStatus.CONFIRMED,
        checkinDate: LessThan(checkoutDate),
        checkoutDate: MoreThan(checkinDate),
      },
    });

    return !!conflictingBooking;
  }

  private async getPrices(
    checkinDate: Date,
    checkoutDate: Date,
    roomId: string
  ): Promise<{ date: Date; price: number }[]> {
    const prices = await this.pricesRepository.find({
      where: {
        roomId: roomId,
        date: Between(
          new Date(checkinDate),
          new Date(new Date(checkoutDate).getTime() - 24 * 60 * 60 * 1000)
        ),
      },
    });

    return prices.map((price) => ({
      date: price.date,
      price: price.price,
    }));
  }

  async createBooking(bookDto: BookDto) {
    const refCode = this.generateRefCode();

    const isUnavailable = await this.checkAvailableRoom(
      bookDto.checkinDate,
      bookDto.checkoutDate,
      bookDto.roomId
    );

    if (isUnavailable) {
      throw new ConflictException(
        `This room is unavailable for the selected dates.`
      );
    }

    const booking = this.bookingRepository.create({
      refCode,
      checkinDate: bookDto.checkinDate,
      checkoutDate: bookDto.checkoutDate,
      guestNumber: bookDto.guestNumber,
      additionGuestNumber: bookDto.additionGuestNumber,
      name: bookDto.name,
      phoneNumber: bookDto.phoneNumber,
      status: BookingStatus.PAYMENT,
      totalPrice: bookDto.totalPrice,
      roomId: bookDto.roomId,
      customerId: bookDto.customerId,
    });

    const savedBooking = await this.bookingRepository.save(booking);
    const prices = await this.getPrices(
      bookDto.checkinDate,
      bookDto.checkoutDate,
      bookDto.roomId
    );

    return {
      refCode: savedBooking.refCode,
      id: savedBooking.id,
      prices: prices,
    };
  }

  async getAllBookedRooms() {
    return await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  async getAllBookRoomsNoconditon(query?: { status?: BookingStatus }) {
    if (query?.status) {
      return await this.bookingRepository.find({
        where: {
          status: query.status,
        },
      });
    }
    return await this.bookingRepository.find();
  }

  async getBookedRoom(refCode: string): Promise<BookingEntity | null> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: {
          refCode: refCode,
          status: BookingStatus.CONFIRMED,
        },
      });

      return booking;
    } catch (error) {
      throw new InternalServerErrorException("Database query failed");
    }
  }

  async getBookedRoomsByPhoneNumber(
    phoneNumber: string
  ): Promise<BookingEntity[]> {
    try {
      const bookings = await this.bookingRepository.find({
        where: {
          phoneNumber: phoneNumber,
        },
      });

      return bookings;
    } catch (error) {
      throw new InternalServerErrorException("Database query failed");
    }
  }

  async getAllDate() {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(1);
    endDate.setDate(0);
    endDate.setHours(23, 59, 59, 999);

    return await this.bookingRepository
      .find({
        where: {
          status: BookingStatus.CONFIRMED,
          createdAt: Between(startDate, endDate),
        },
      })
      .then((bookings) => {
        return bookings.map((booking) => {
          return {
            checkinDate: booking.checkinDate,
            checkoutDate: booking.checkoutDate,
          };
        });
      });
  }

  async getBookingsByDate(date: string, status?: BookingStatus): Promise<BookingEntity[]> {
    try {
      const searchDate = new Date(date);

      const whereCondition: any = {
        checkinDate: LessThanOrEqual(searchDate),
        checkoutDate: MoreThan(searchDate),
      };

      if (status) {
        whereCondition.status = status;
      }

      const bookings = await this.bookingRepository.find({
        where: whereCondition,
      });

      return bookings;
    } catch (error) {
      throw new InternalServerErrorException("Database query failed");
    }
  }

  async getBookingsByCustomer(id: string, phoneNumber: string, status?: BookingStatus): Promise<BookingEntity[]> {
    try {
      let whereCondition: any = [
        { customerId: id },
        { phoneNumber: phoneNumber }
      ];

      if (status) {
        whereCondition = whereCondition.map((cond: any) => ({ ...cond, status }));
      }

      const bookings = await this.bookingRepository.find({
        where: whereCondition,
        order: {
          createdAt: "DESC",
        },
      });

      return bookings;
    } catch (error) {
      throw new InternalServerErrorException("Database query failed");
    }
  }

  async updateBookingStatus(id: string, status: BookingStatus): Promise<{ message: string }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`ID ไม่ถูกต้อง: ${id} (ต้องเป็น UUID)`);
    }

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`ไม่พบการจอง ID: ${id}`);
    }

    booking.status = status;
    await this.bookingRepository.save(booking);

    return { message: "อัปเดตสถานะการจองสำเร็จ" };
  }
}
