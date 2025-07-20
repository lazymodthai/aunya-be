import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { BookDto } from './dto/book.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  private generateRefCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Generate 5-digit random number
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    return `AY${year}${month}${day}${randomNum}`;
  }

  async createBooking(bookDto: BookDto) {
    // Generate unique reference code
    const refCode = this.generateRefCode();
    
    // Create new booking entity
    const booking = this.bookingRepository.create({
      refCode,
      checkinDate: bookDto.checkinDate,
      checkoutDate: bookDto.checkoutDate,
      guestNumber: bookDto.guestNumber,
      additionGuestNumber: bookDto.additionGuestNumber,
      name: bookDto.name,
      phoneNumber: bookDto.phoneNumber,
      status: 'PENDING', // Default status
    });

    // Save to database
    const savedBooking = await this.bookingRepository.save(booking);

    return {
      refCode: savedBooking.refCode,
      id: savedBooking.id,
    };
  }
}