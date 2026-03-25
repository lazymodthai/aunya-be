import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, LessThan, LessThanOrEqual, MoreThan, Not, Repository } from "typeorm";
import { BookDto } from "./dto/book.dto";
import { BookingStatus } from "@/constants/booking.enum";
import { BookingEntity } from "@/entities/booking.entity";
import { PriceCalendarEntity } from "entities/price-calendar.entity";
import { FilesService } from "../files/files.service";
import { LineNotificationService } from "../line-notification/line-notification.service";

import { SettingsService, SettingKey } from "../settings/settings.service";

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PriceCalendarEntity)
    private readonly pricesRepository: Repository<PriceCalendarEntity>,
    private readonly filesService: FilesService,
    @Inject(forwardRef(() => LineNotificationService))
    private readonly lineNotificationService: LineNotificationService,
    private readonly settingsService: SettingsService,
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
      childrenNumber: bookDto.childrenNumber ?? 0,
      additionGuestNumber: bookDto.additionGuestNumber,
      additionTowel: bookDto.additionTowel ?? 0,
      name: bookDto.name,
      phoneNumber: bookDto.phoneNumber,
      status: BookingStatus.PAYMENT,
      totalPrice: bookDto.totalPrice,
      discount: bookDto.discount,
      isOnlyDeposit: bookDto.isOnlyDeposit ?? false,
      paidAmount: bookDto.paidAmount,
      remainingAmount: bookDto.remainingAmount,
      roomId: bookDto.roomId,
      customerId: bookDto.customerId,
      remark: bookDto.remark,
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

  /**
   * Get all bookings with associated files (QR codes and payment slips)
   * Join using booking.refCode = files.roomId
   */
  async getAllBookRoomsWithFiles(query?: { status?: BookingStatus }) {
    // Get all bookings
    let bookings: BookingEntity[];
    if (query?.status) {
      bookings = await this.bookingRepository.find({
        where: {
          status: query.status,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    } else {
      bookings = await this.bookingRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });
    }

    const bookingsWithFiles = await Promise.all(
      bookings.map(async (booking) => {
        const files = await this.filesService.getFilesByRoomId(booking.refCode);
        const qrCode = files.find(f => f.type === "qrcode");
        const slips = files.filter(f => f.type !== "qrcode");
        return {
          ...booking,
          files: {
            qrCode: qrCode ? {
              id: qrCode.id,
              fileUrl: qrCode.fileUrl,
              createdAt: qrCode.createdAt,
            } : null,
            slips: slips.map(slip => ({
              id: slip.id,
              originalName: slip.originalName,
              fileUrl: slip.fileUrl,
              typeslip: slip.typeslip,
              createdAt: slip.createdAt,
            })),
          },
        };
      })
    );

    return bookingsWithFiles;
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

  async getDisabledDates(): Promise<string[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 11, 31);

    const [bookings, prices] = await Promise.all([
      this.bookingRepository.find({
        where: {
          status: In([
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.CHECKED_OUT
          ]),
          checkinDate: LessThanOrEqual(endDate),
          checkoutDate: MoreThan(startDate),
        },
      }),
      this.pricesRepository.find({
        where: [
          { date: Between(startDate, endDate), isMaintenance: true },
          { date: Between(startDate, endDate), price: 0 },
        ],
      }),
    ]);

    const toDateString = (date: Date): string => {
      const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    const disabledSet = new Set<string>();

    for (const booking of bookings) {
      const checkin = new Date(booking.checkinDate);
      const checkout = new Date(booking.checkoutDate);
      for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
        disabledSet.add(toDateString(d));
      }
    }

    for (const price of prices) {
      disabledSet.add(toDateString(new Date(price.date)));
    }

    return Array.from(disabledSet).sort();
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

  async updateBookingStatus(id: string, status: BookingStatus, additionalPayment?: number, remark?: string): Promise<{ message: string }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`ID ไม่ถูกต้อง: ${id} (ต้องเป็น UUID)`);
    }

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`ไม่พบการจอง ID: ${id}`);
    }

    booking.status = status;

    if (additionalPayment != null && additionalPayment > 0) {
      booking.paidAmount = (booking.paidAmount ?? 0) + additionalPayment;
      booking.remainingAmount = Math.max((booking.remainingAmount ?? 0) - additionalPayment, 0);
    }

    if (remark) {
      booking.remark = remark;
    }

    await this.bookingRepository.save(booking);

    // ส่ง LINE notification แจ้งเตือนการอัปเดตสถานะและหมายเหตุ
    if (status === BookingStatus.CONFIRMED || status === BookingStatus.CANCELLED) {
      this.lineNotificationService
        .sendStatusUpdateNotification(booking)
        .catch((err) => {
          console.error('LINE status update notification error:', err);
        });
    }

    // ส่ง LINE notification เมื่อสถานะเปลี่ยนเป็น PENDING
    if (status === BookingStatus.PENDING) {
      this.filesService
        .getFilesByRoomId(booking.refCode)
        .then((files) => {
          const slipUrls = files
            .filter((f) => f.type !== 'qrcode')
            .map((f) => f.fileUrl);
          return this.lineNotificationService.sendBookingNotification(
            booking,
            slipUrls,
          );
        })
        .catch((err) => {
          console.error('LINE notification error:', err);
        });
    }

    // หากสถานะเปลี่ยนเป็น Confirmed ให้ยกเลิกรายการอื่นที่วันที่ซ้อนทับกัน
    if (status === BookingStatus.CONFIRMED) {
      await this.bookingRepository.update(
        {
          // วันที่ซ้อนทับ: checkinDate < checkoutDate ของรายการที่ Confirmed และ checkoutDate > checkinDate ของรายการที่ Confirmed
          checkinDate: LessThan(booking.checkoutDate),
          checkoutDate: MoreThan(booking.checkinDate),
          id: Not(id),
          status: In([BookingStatus.PENDING, BookingStatus.PAYMENT]),
        },
        { status: BookingStatus.CANCELLED }
      );
    }

    return { message: "อัปเดตสถานะการจองสำเร็จ" };
  }

  async updateBookingRemark(id: string, remark: string): Promise<{ message: string }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`ID ไม่ถูกต้อง: ${id} (ต้องเป็น UUID)`);
    }

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`ไม่พบการจอง ID: ${id}`);
    }

    booking.remark = remark;

    await this.bookingRepository.save(booking);

    return { message: "อัปเดตหมายเหตุการจองสำเร็จ" };
  }

  async getSummary(year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const [extraBedPrice, towelPrice] = await Promise.all([
      this.settingsService.getSettingAsNumber(SettingKey.EXTRA_BED_PRICE),
      this.settingsService.getSettingAsNumber(SettingKey.TOWEL_PRICE),
    ]);

    const bookings = await this.bookingRepository.find({
      where: {
        checkinDate: LessThan(endDate),
        checkoutDate: MoreThan(startDate),
      },
    });

    const initSummary = () => ({
      revenue: 0,
      rentRevenue: 0,
      extraBedRevenue: 0,
      extraTowelRevenue: 0,
      discountUsed: 0,
      guestCount: 0,
      childrenCount: 0,
      bookingCount: 0,
      nightCount: 0,
      potentialRevenue: 0,
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ...initSummary(),
    }));

    const yearly = initSummary();

    const successStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.CHECKED_IN,
      BookingStatus.CHECKED_OUT,
    ];

    bookings.forEach((booking) => {
      const checkin = new Date(booking.checkinDate);
      const checkout = new Date(booking.checkoutDate);
      const bookingNightCount = Math.max(1, Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)));
      const isSuccess = successStatuses.includes(booking.status);

      const ebRev = (booking.additionGuestNumber || 0) * extraBedPrice;
      const towelRev = (booking.additionTowel || 0) * towelPrice;
      const discount = booking.discount || 0;
      const gross = (booking.totalPrice || 0) + discount;
      const rentRev = gross - ebRev - towelRev;

      // Stats per night to be split across months
      const perNightStats = {
        revenue: (booking.totalPrice || 0) / bookingNightCount,
        rentRevenue: rentRev / bookingNightCount,
        extraBedRevenue: ebRev / bookingNightCount,
        extraTowelRevenue: towelRev / bookingNightCount,
        discountUsed: discount / bookingNightCount,
        potentialRevenue: gross / bookingNightCount,
        nightCount: 1,
      };

      const monthsTouched = new Set<number>();

      // Iterate through each night of the booking
      for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
        // Only count nights within the target year
        if (d >= startDate && d <= endDate) {
          const m = d.getUTCMonth();
          monthsTouched.add(m);

          // Add per-night stats to monthly and yearly
          monthly[m].potentialRevenue += perNightStats.potentialRevenue;
          yearly.potentialRevenue += perNightStats.potentialRevenue;

          if (isSuccess) {
            monthly[m].revenue += perNightStats.revenue;
            monthly[m].rentRevenue += perNightStats.rentRevenue;
            monthly[m].extraBedRevenue += perNightStats.extraBedRevenue;
            monthly[m].extraTowelRevenue += perNightStats.extraTowelRevenue;
            monthly[m].discountUsed += perNightStats.discountUsed;
            monthly[m].nightCount += perNightStats.nightCount;

            yearly.revenue += perNightStats.revenue;
            yearly.rentRevenue += perNightStats.rentRevenue;
            yearly.extraBedRevenue += perNightStats.extraBedRevenue;
            yearly.extraTowelRevenue += perNightStats.extraTowelRevenue;
            yearly.discountUsed += perNightStats.discountUsed;
            yearly.nightCount += perNightStats.nightCount;
          }
        }
      }

      // Handle guest and booking counts (counted once per month the booking touches)
      if (isSuccess) {
        monthsTouched.forEach(m => {
          monthly[m].guestCount += (booking.guestNumber || 0) + (booking.additionGuestNumber || 0);
          monthly[m].childrenCount += booking.childrenNumber || 0;
          monthly[m].bookingCount += 1;
        });

        // For yearly, we only count them once per booking
        // But only if at least one night was within the year
        if (monthsTouched.size > 0) {
          yearly.guestCount += (booking.guestNumber || 0) + (booking.additionGuestNumber || 0);
          yearly.childrenCount += booking.childrenNumber || 0;
          yearly.bookingCount += 1;
        }
      }
    });

    const now = new Date();
    const currentMonth = targetYear === now.getFullYear() ? monthly[now.getMonth()] : null;

    return {
      year: targetYear,
      monthly,
      yearly,
      currentMonth,
    };
  }
}


