import { BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
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
import { CalculatePriceDto } from './dto/calculate-price.dto';

export class PricesService {
  private readonly logger = new Logger(PricesService.name);
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private toDateString(date: Date): string {
    const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }

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

  async generatePrices(generatePriceDto: GeneratePriceDto): Promise<{ message: string; count: number; holidayCount: number; botSuccess: boolean }> {
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

    // Try fetching holidays from BOT API gracefully
    let holidayMap = new Map<string, string>();
    let botSuccess = false;
    try {
      const botRes = await this.fetchBotHolidays(year);
      if (botRes.success && botRes.holidays.length > 0) {
        holidayMap = new Map<string, string>(botRes.holidays.map(h => [h.date, h.description]));
        botSuccess = true;
      }
    } catch (e: any) {
      this.logger.warn(`Could not fetch BOT holidays when generating prices for year ${year}: ${e.message}`);
    }

    const pricesToCreate: PriceCalendarEntity[] = [];

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      const currentDateStr = this.toDateString(day);
      const dayOfWeek = day.getDay();

      let price: number;
      let dayType: DayType;
      let description: string | null = null;

      if (holidayMap.has(currentDateStr)) {
        dayType = DayType.HOLIDAY;
        price = holidayPrice;
        description = holidayMap.get(currentDateStr) || '';
      } else if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        dayType = DayType.WEEKEND;
        price = weekendPrice;
        const dayNames: Record<number, string> = { 0: 'วันอาทิตย์', 5: 'วันศุกร์', 6: 'วันเสาร์' };
        description = dayNames[dayOfWeek];
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

    const holidayCount = pricesToCreate.filter(p => p.dayType === DayType.HOLIDAY).length;
    const message = botSuccess
      ? `สร้างข้อมูลราคาปี ${year} สำเร็จ (รวมวันหยุดจาก ธปท. ${holidayCount} วัน)`
      : `สร้างข้อมูลราคาปี ${year} สำเร็จ (ไม่สามารถดึงวันหยุดจาก ธปท. ได้ สามารถกดซิงค์วันหยุดได้ภายหลัง)`;

    return {
      message,
      count: pricesToCreate.length,
      holidayCount,
      botSuccess,
    };
  }

  async fetchBotHolidays(year: number): Promise<{ success: boolean; message: string; holidays: { date: string; description: string }[] }> {
    const token = this.configService.get<string>('BOT_API_TOKEN');
    if (!token) {
      return {
        success: false,
        message: 'BOT API Token ยังไม่ได้ตั้งค่าในระบบ (.env)',
        holidays: [],
      };
    }

    try {
      const BOT_API_URL = this.configService.get<string>('BOT_API_URL');
      if (!BOT_API_URL) {
        return {
          success: false,
          message: 'BOT API URL ยังไม่ได้ตั้งค่าในระบบ (.env)',
          holidays: [],
        };
      }
      const response = await firstValueFrom(
        this.httpService.get(`${BOT_API_URL}/?year=${year}`, {
          headers: { 'Accept': 'application/json', 'Authorization': `${token}` },
        }),
      );
      const data = response.data?.result?.data || [];
      const holidays = data.map((h: any) => ({
        date: h.Date,
        description: h.HolidayDescriptionThai || h.HolidayDescription || 'วันหยุดนักขัตฤกษ์',
      }));
      return {
        success: true,
        message: `ดึงข้อมูลวันหยุดปี ${year} จาก ธปท. สำเร็จ (${holidays.length} วัน)`,
        holidays,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to fetch holidays from BOT API for year ${year}: ${error.message}`);
      return {
        success: false,
        message: `ไม่สามารถดึงข้อมูลวันหยุดจาก ธปท. ได้ (${error.message || 'Error'})`,
        holidays: [],
      };
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
        status: In([
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.CHECKED_IN,
          BookingStatus.CHECKED_OUT
        ]),
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

  async getGeneratedYears(roomId: string): Promise<{ message: string; years: number[] }> {
    const rawYears = await this.priceCalendarRepository
      .createQueryBuilder('pc')
      .select('DISTINCT EXTRACT(YEAR FROM pc.date)', 'year')
      .where('pc.roomId = :roomId', { roomId })
      .orderBy('year', 'ASC')
      .getRawMany();

    const years = rawYears
      .map(r => Number(r.year))
      .filter(y => !isNaN(y) && y > 0);

    return {
      message: 'ดึงข้อมูลปีที่สร้างราคาแล้วสำเร็จ',
      years,
    };
  }

  async getYearPriceSummaries(roomId: string): Promise<{
    message: string;
    summaries: {
      year: number;
      minWeekdayPrice: number;
      maxWeekdayPrice: number;
      avgWeekdayPrice: number;
      minWeekendPrice: number;
      maxWeekendPrice: number;
      avgWeekendPrice: number;
      minHolidayPrice: number;
      maxHolidayPrice: number;
      avgHolidayPrice: number;
      holidayCount: number;
      totalDays: number;
    }[];
  }> {
    const raw = await this.priceCalendarRepository
      .createQueryBuilder('pc')
      .select('EXTRACT(YEAR FROM pc.date)', 'year')
      .addSelect('MIN(CASE WHEN pc.dayType = :weekday THEN pc.price END)', 'minWeekdayPrice')
      .addSelect('MAX(CASE WHEN pc.dayType = :weekday THEN pc.price END)', 'maxWeekdayPrice')
      .addSelect('ROUND(AVG(CASE WHEN pc.dayType = :weekday THEN pc.price END))', 'avgWeekdayPrice')
      .addSelect('MIN(CASE WHEN pc.dayType = :weekend THEN pc.price END)', 'minWeekendPrice')
      .addSelect('MAX(CASE WHEN pc.dayType = :weekend THEN pc.price END)', 'maxWeekendPrice')
      .addSelect('ROUND(AVG(CASE WHEN pc.dayType = :weekend THEN pc.price END))', 'avgWeekendPrice')
      .addSelect('MIN(CASE WHEN pc.dayType = :holiday THEN pc.price END)', 'minHolidayPrice')
      .addSelect('MAX(CASE WHEN pc.dayType = :holiday THEN pc.price END)', 'maxHolidayPrice')
      .addSelect('ROUND(AVG(CASE WHEN pc.dayType = :holiday THEN pc.price END))', 'avgHolidayPrice')
      .addSelect('COUNT(CASE WHEN pc.dayType = :holiday THEN 1 END)', 'holidayCount')
      .addSelect('COUNT(*)', 'totalDays')
      .where('pc.roomId = :roomId', { roomId })
      .setParameters({
        weekday: DayType.WEEKDAY,
        weekend: DayType.WEEKEND,
        holiday: DayType.HOLIDAY,
      })
      .groupBy('EXTRACT(YEAR FROM pc.date)')
      .orderBy('year', 'ASC')
      .getRawMany();

    const summaries = raw
      .map(r => ({
        year: Number(r.year),
        minWeekdayPrice: Number(r.minweekdayprice ?? r.minWeekdayPrice ?? 0),
        maxWeekdayPrice: Number(r.maxweekdayprice ?? r.maxWeekdayPrice ?? 0),
        avgWeekdayPrice: Number(r.avgweekdayprice ?? r.avgWeekdayPrice ?? 0),
        minWeekendPrice: Number(r.minweekendprice ?? r.minWeekendPrice ?? 0),
        maxWeekendPrice: Number(r.maxweekendprice ?? r.maxWeekendPrice ?? 0),
        avgWeekendPrice: Number(r.avgweekendprice ?? r.avgWeekendPrice ?? 0),
        minHolidayPrice: Number(r.minholidayprice ?? r.minHolidayPrice ?? 0),
        maxHolidayPrice: Number(r.maxholidayprice ?? r.maxHolidayPrice ?? 0),
        avgHolidayPrice: Number(r.avgholidayprice ?? r.avgHolidayPrice ?? 0),
        holidayCount: Number(r.holidaycount ?? r.holidayCount ?? 0),
        totalDays: Number(r.totaldays ?? r.totalDays ?? 0),
      }))
      .filter(s => !isNaN(s.year) && s.year > 0);

    return {
      message: 'ดึงข้อมูลสรุปราคาแต่ละปีสำเร็จ',
      summaries,
    };
  }

  async getYearHolidaysFromDB(roomId: string, year: number): Promise<{
    message: string;
    holidays: { date: string; price: number; description: string }[];
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const records = await this.priceCalendarRepository.find({
      where: {
        roomId,
        date: Between(startDate, endDate),
        dayType: DayType.HOLIDAY,
      },
      order: { date: 'ASC' },
    });

    const holidays = records.map(r => ({
      date: this.toDateString(new Date(r.date)),
      price: Number(r.price),
      description: r.description || 'วันหยุดนักขัตฤกษ์',
    }));

    return {
      message: `ดึงรายการวันหยุดปี ${year} สำเร็จ (${holidays.length} วัน)`,
      holidays,
    };
  }

  async syncHolidays(roomId: string, year: number, holidayPrice?: number): Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
  }> {
    const res = await this.fetchBotHolidays(year);
    if (!res.success || res.holidays.length === 0) {
      return {
        success: false,
        message: res.message || 'ไม่พบข้อมูลวันหยุดจาก ธปท.',
        updatedCount: 0,
      };
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const existingPrices = await this.priceCalendarRepository.find({
      where: {
        roomId,
        date: Between(startDate, endDate),
      },
    });

    if (existingPrices.length === 0) {
      throw new NotFoundException(`ไม่พบข้อมูลราคาของปี ${year} ในระบบ กรุณาสร้างราคาทั้งปีก่อน`);
    }

    const holidayMap = new Map(res.holidays.map(h => [h.date, h.description]));
    let updatedCount = 0;

    for (const p of existingPrices) {
      const dateStr = this.toDateString(new Date(p.date));
      if (holidayMap.has(dateStr)) {
        p.dayType = DayType.HOLIDAY;
        p.description = holidayMap.get(dateStr) || 'วันหยุดนักขัตฤกษ์';
        if (holidayPrice != null && holidayPrice > 0) {
          p.price = holidayPrice;
        }
        updatedCount++;
      }
    }

    await this.priceCalendarRepository.save(existingPrices, { chunk: 100 });

    return {
      success: true,
      message: `ซิงค์วันหยุด ธปท. ปี ${year} สำเร็จ (อัปเดต ${updatedCount} วัน)`,
      updatedCount,
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

  async calculatePrice(calculatePriceDto: CalculatePriceDto): Promise<{
    message: string;
    totalPrice: number;
    nights: number;
    priceDetails: { date: string; price: number }[];
  }> {
    const { roomId, checkinDate, checkoutDate } = calculatePriceDto;

    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);

    if (checkout <= checkin) {
      throw new BadRequestException('วันที่ checkout ต้องมากกว่าวันที่ checkin');
    }

    // ดึงราคาจาก checkin ถึง checkout - 1 วัน (วันออกไม่คิด)
    const lastNight = new Date(checkout);
    lastNight.setDate(lastNight.getDate() - 1);

    const prices = await this.priceCalendarRepository.find({
      where: {
        roomId,
        date: Between(checkin, lastNight),
      },
      order: { date: 'ASC' },
    });

    const priceDetails = prices.map(price => ({
      date: this.toDateString(new Date(price.date)),
      price: Number(price.price),
    }));

    const totalPrice = priceDetails.reduce((sum, item) => sum + item.price, 0);
    const nights = priceDetails.length;

    return {
      message: 'คำนวณราคาสำเร็จ',
      totalPrice,
      nights,
      priceDetails,
    };
  }
}