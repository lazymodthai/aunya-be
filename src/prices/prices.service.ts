import { BadRequestException, ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { GeneratePriceDto } from './dto/generate-price.dto';
import { PriceCalendarEntity } from '@/entities/price-calendar.entity';
import { BookingStatus, DayType, RoomStatus } from 'constants/booking.enum';
import { GenerateDiscountCodeDto } from './dto/generate-discount-code.dto';
import { GetPriceByMonthDto } from './dto/get-price-by-month.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { ResetPriceDto } from './dto/reset-price.dto';
import { BookingEntity } from '@/entities/booking.entity';
import { DiscountCodeEntity } from '@/entities/discount-codes.entity';

export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  constructor(
    @InjectRepository(PriceCalendarEntity)
    private readonly priceCalendarRepository: Repository<PriceCalendarEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(DiscountCodeEntity)
    private readonly discountCodeRepository: Repository<DiscountCodeEntity>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  async generatePrices(generatePriceDto: GeneratePriceDto): Promise<{ message: string; count: number }> {
    const { year, roomId, weekdayPrice, weekendPrice, holidayPrice } = generatePriceDto;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const existingPrice = await this.priceCalendarRepository.findOne({
      where: {
        roomId,
        date: Between(startDate, endDate),
      },
    });
    if (existingPrice) {
      throw new ConflictException(`ราคาสำหรับห้อง ID: ${roomId} ปี ${year} ได้ถูกสร้างไว้แล้ว`);
    }

    const holidays = await this._fetchHolidays();
    const holidayMap = new Map<string, string>(
      holidays.map(h => [h.Date, h.HolidayDescriptionThai])
    );

    const pricesToCreate: PriceCalendarEntity[] = [];

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      const currentDateStr = day.toISOString().split('T')[0];
      const dayOfWeek = day.getDay();

      let price: number;
      let dayType: DayType;
      let description: string | null = null;

      if (holidayMap.has(currentDateStr)) {
        dayType = DayType.HOLIDAY;
        price = holidayPrice;
        description = holidayMap.get(currentDateStr) || '';
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayType = DayType.WEEKEND;
        price = weekendPrice;
        description = dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์';
      } else {
        dayType = DayType.WEEKDAY;
        price = weekdayPrice;
      }

      const newPriceEntry = this.priceCalendarRepository.create({
        date: currentDateStr,
        price,
        dayType,
        roomId,
        description,
      });
      pricesToCreate.push(newPriceEntry);
    }

    await this.priceCalendarRepository.save(pricesToCreate, { chunk: 100 });

    return {
      message: `สร้างข้อมูลราคาปี ${year} สำเร็จ`,
      count: pricesToCreate.length,
    };
  }

  private async _fetchHolidays(): Promise<{ Date: string; HolidayDescriptionThai: string }[]> {
    const clientId = this.configService.get<string>('BOT_API_CLIENT_ID');
    if (!clientId) {
      throw new InternalServerErrorException('BOT API Client ID is not configured.');
    }

    try {
      const BOT_API_URL = this.configService.get<string>('BOT_API_URL');
      if (!BOT_API_URL) {
        throw new InternalServerErrorException('BOT API URL is not configured.');
      }
      const response = await firstValueFrom(
        this.httpService.get(BOT_API_URL, {
          headers: { 'X-IBM-Client-Id': clientId },
        }),
      );
      return response.data.result.data;
    } catch (error) {
      this.logger.error('Failed to fetch holidays from BOT API', error.stack);
      throw new InternalServerErrorException('ไม่สามารถดึงข้อมูลวันหยุดได้');
    }
  }

  async generateDiscountCode(generateDiscountCode: GenerateDiscountCodeDto): Promise<{ message: string; discountCode: DiscountCodeEntity }> {
    const { code, discount, discountPercentage, count } = generateDiscountCode;

    // ต้องกำหนด discount หรือ discountPercentage อย่างน้อย 1 อย่าง
    if (discount === undefined && discountPercentage === undefined) {
      throw new BadRequestException('ต้องกำหนด discount หรือ discountPercentage อย่างน้อย 1 อย่าง');
    }

    // สร้าง code ถ้าไม่ได้ส่งมา
    const discountCode = code || this.generateRandomCode();

    // ตรวจสอบว่า code ซ้ำหรือไม่
    const existingCode = await this.discountCodeRepository.findOne({ where: { code: discountCode } });
    if (existingCode) {
      throw new ConflictException(`Discount code "${discountCode}" มีอยู่แล้ว`);
    }

    const newDiscountCode = this.discountCodeRepository.create({
      code: discountCode,
      discount: discount ?? null,
      discountPercentage: discountPercentage ?? null,
      count: count ?? 1,
    });

    const savedDiscountCode = await this.discountCodeRepository.save(newDiscountCode);

    return {
      message: 'สร้าง discount code สำเร็จ',
      discountCode: savedDiscountCode,
    };
  }

  private generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getPriceByMonth(getPriceByMonth: GetPriceByMonthDto): Promise<{ message: string, prices: { id: string, date: Date, price: number, status: RoomStatus, isMaintenance: boolean }[] }> {
    if (getPriceByMonth.month < 1 || getPriceByMonth.month > 12) {
      throw new ConflictException('เดือนต้องอยู่ระหว่าง 1 ถึง 12');
    }

    const startDate = new Date(getPriceByMonth.year, getPriceByMonth.month - 1, 1);
    const endDate = new Date(getPriceByMonth.year, getPriceByMonth.month, 0);

    const prices = await this.priceCalendarRepository.find({
      where: {
        date: Between(startDate, endDate),
        roomId: getPriceByMonth.roomId
      },
      order: {
        date: 'ASC'
      }
    });

    const confirmedBookings = await this.bookingRepository.find({
      where: {
        roomId: getPriceByMonth.roomId,
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        checkinDate: LessThanOrEqual(endDate),
        checkoutDate: MoreThan(startDate)
      }
    });

    const isDateBooked = (checkDate: Date): boolean => {
      for (const booking of confirmedBookings) {
        const checkin = new Date(booking.checkinDate);
        const checkout = new Date(booking.checkoutDate);

        if (checkDate >= checkin && checkDate < checkout) {
          return true;
        }
      }
      return false;
    };

    return {
      message: 'ดึงข้อมูลราคาสำเร็จ',
      prices: prices.length === 0 ? [] : prices.map(price => ({
        id: price.id,
        date: price.date,
        price: Number(price.price),
        status: isDateBooked(new Date(price.date)) ? RoomStatus.UNAVAILABLE : RoomStatus.AVAILABLE,
        isMaintenance: price.isMaintenance
      }))
    };
  }

  async updatePrice(id: string, updatePriceDto: UpdatePriceDto): Promise<{ message: string }> {
    if (!this.uuidRegex.test(id)) {
      throw new BadRequestException(`ID ไม่ถูกต้อง: ${id} (ต้องเป็น UUID)`);
    }

    const priceCalendar = await this.priceCalendarRepository.findOne({ where: { id } });
    if (!priceCalendar) {
      throw new NotFoundException(`ไม่พบข้อมูลราคา ID: ${id}`);
    }

    priceCalendar.price = updatePriceDto.price;
    await this.priceCalendarRepository.save(priceCalendar);

    return { message: 'อัปเดตราคาสำเร็จ' };
  }

  async updateMaintenance(id: string, updateMaintenanceDto: UpdateMaintenanceDto): Promise<{ message: string }> {
    if (!this.uuidRegex.test(id)) {
      throw new BadRequestException(`ID ไม่ถูกต้อง: ${id} (ต้องเป็น UUID)`);
    }

    const priceCalendar = await this.priceCalendarRepository.findOne({ where: { id } });
    if (!priceCalendar) {
      throw new NotFoundException(`ไม่พบข้อมูลราคา ID: ${id}`);
    }

    priceCalendar.isMaintenance = updateMaintenanceDto.isMaintenance;
    await this.priceCalendarRepository.save(priceCalendar);

    return { message: 'อัปเดตสถานะการปิดปรับปรุงสำเร็จ' };
  }

  async resetPrices(resetPriceDto: ResetPriceDto): Promise<{ message: string; deletedCount: number }> {
    const { year, roomId } = resetPriceDto;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const result = await this.priceCalendarRepository
      .createQueryBuilder()
      .delete()
      .from(PriceCalendarEntity)
      .where('roomId = :roomId', { roomId })
      .andWhere('date >= :startDate', { startDate })
      .andWhere('date <= :endDate', { endDate })
      .execute();

    return {
      message: `ลบข้อมูลราคาของปี ${year} สำเร็จ`,
      deletedCount: result.affected || 0,
    };
  }

  async getAllDiscountCodes(): Promise<{ message: string; discountCodes: DiscountCodeEntity[] }> {
    const discountCodes = await this.discountCodeRepository.find({
      order: { createdAt: 'DESC' }
    });

    return {
      message: 'ดึงข้อมูล discount codes สำเร็จ',
      discountCodes,
    };
  }

  async getDiscountByCode(code: string): Promise<DiscountCodeEntity> {
    const discountCode = await this.discountCodeRepository.findOne({
      where: { code }
    });

    if (!discountCode) {
      throw new NotFoundException(`ไม่พบ discount code: ${code}`);
    }

    return discountCode;

  }

  async useDiscountCode(code: string): Promise<{ message: string; discountCode: number }> {
    const discountCode = await this.discountCodeRepository.findOne({
      where: { code }
    });

    if (!discountCode) {
      throw new NotFoundException(`ไม่พบ discount code: ${code}`);
    }

    if (discountCode.count <= 0) {
      throw new BadRequestException(`Discount code "${code}" ถูกใช้หมดแล้ว`);
    }

    discountCode.count -= 1;
    discountCode.usedAt = new Date();
    discountCode.updatedAt = new Date();

    const savedDiscountCode = await this.discountCodeRepository.save(discountCode);

    return {
      message: 'ใช้ discount code สำเร็จ',
      discountCode: savedDiscountCode.count,
    };
  }
}