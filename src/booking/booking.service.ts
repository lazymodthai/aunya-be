import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BookingEntity } from './booking.entity';
import { BookDto } from './dto/book.dto';
import { BookingStatus } from './enums/booking.enum';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>
  ) {}

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

  async createBooking(bookDto: BookDto) {
    const refCode = this.generateRefCode();

    const booking = this.bookingRepository.create({
      refCode,
      checkinDate: bookDto.checkinDate,
      checkoutDate: bookDto.checkoutDate,
      guestNumber: bookDto.guestNumber,
      additionGuestNumber: bookDto.additionGuestNumber,
      name: bookDto.name,
      phoneNumber: bookDto.phoneNumber,
      status: BookingStatus.PENDING,
      totalPrice: bookDto.totalPrice,
      roomId: bookDto.roomId,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    return {
      refCode: savedBooking.refCode,
      id: savedBooking.id,
    };
  }

  async getAllBookedRooms() {
    return await this.bookingRepository.find({
      where: {
        status: BookingStatus.CONFIRMED,
      },
    });
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
}