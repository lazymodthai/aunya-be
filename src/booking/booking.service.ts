import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Raw, Repository } from 'typeorm';
import { BookDto } from './dto/book.dto';
import { BookingStatus } from './enums/booking.enum';
import { GeneratePriceDto } from '../prices/dto/generate-price.dto';
import { BookingEntity } from './entities/booking.entity';
import { RoomEntity } from './entities/rooms.entity';
import { format } from 'date-fns';

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

  private async checkAvailableRoom(checkinDate: Date, checkoutDate: Date, roomId: string): Promise<boolean> {
    if (!checkinDate || !checkoutDate || !roomId) {
      return true;
    }

    // 2. ใช้ฟังก์ชัน format เพื่อแปลง Date object เป็น String ที่ต้องการ
    // 'yyyy-MM-dd' คือรูปแบบที่เราต้องการ (เช่น 2025-08-22)
    const checkinDateStr = format(checkinDate, 'yyyy-MM-dd');
    const checkoutDateStr = format(checkoutDate, 'yyyy-MM-dd');

    const conflictingBooking = await this.bookingRepository.findOne({
      where: {
        roomId: roomId,
        status: BookingStatus.CONFIRMED,
        checkinDate: Raw(alias => `CAST(${alias} AS DATE) < :date`, { date: checkoutDateStr }),
        checkoutDate: Raw(alias => `CAST(${alias} AS DATE) > :date`, { date: checkinDateStr }),
      },
    });

    return !!conflictingBooking;
}

  async createBooking(bookDto: BookDto) {
    const refCode = this.generateRefCode();

    const isUnavailable = await this.checkAvailableRoom(bookDto.checkinDate, bookDto.checkoutDate, bookDto.roomId);
    
    if (isUnavailable) {
      throw new ConflictException(`This room is unavailable for the selected dates.`); 
    }

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

  async getBookedRoomsByPhoneNumber(phoneNumber: string): Promise<BookingEntity[]> {
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

}