import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { GeneratePriceDto } from './dto/generate-price.dto';
import { PriceCalendarEntity } from './entities/price-calendar.entity';
import { DayType } from 'src/booking/enums/booking.enum';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  constructor(
    @InjectRepository(PriceCalendarEntity)
    private readonly priceCalendarRepository: Repository<PriceCalendarEntity>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generatePrices(generatePriceDto: GeneratePriceDto): Promise<{ message: string; count: number }> {
    const { roomId, weekdayPrice, weekendPrice, holidayPrice } = generatePriceDto;

    const existingPrice = await this.priceCalendarRepository.findOne({ where: { roomId } });
    if (existingPrice) {
      throw new ConflictException(`ราคาสำหรับห้อง ID: ${roomId} ได้ถูกสร้างไว้แล้ว`);
    }

    // 1. (แก้ไข) ดึงข้อมูลวันหยุดพร้อมคำอธิบายภาษาไทย
    const holidays = await this._fetchHolidays();
    // เปลี่ยนจาก Set เป็น Map เพื่อเก็บชื่อวันหยุดภาษาไทย โดยมี key เป็น 'YYYY-MM-DD' และ value เป็น 'ชื่อวันหยุด'
    const holidayMap = new Map<string, string>(
      holidays.map(h => [h.Date, h.HolidayDescriptionThai])
    );

    const pricesToCreate: PriceCalendarEntity[] = [];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); 

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      const currentDateStr = day.toISOString().split('T')[0];
      const dayOfWeek = day.getDay();

      let price: number;
      let dayType: DayType;
      // 2. (เพิ่ม) ประกาศตัวแปรสำหรับ description และกำหนดค่าเริ่มต้นเป็น null
      let description: string | null = null; 

      if (holidayMap.has(currentDateStr)) {
        dayType = DayType.HOLIDAY;
        price = holidayPrice;
        // 3. (แก้ไข) ดึงชื่อวันหยุดจาก Map มาใส่ใน description
        description = holidayMap.get(currentDateStr) || ''; 
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayType = DayType.WEEKEND;
        price = weekendPrice;
        // 4. (แก้ไข) กำหนด description สำหรับวันเสาร์-อาทิตย์
        description = dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์';
      } else {
        dayType = DayType.WEEKDAY;
        price = weekdayPrice;
        // สำหรับวันธรรมดา description จะยังเป็น null เหมือนเดิม
      }
      
      const newPriceEntry = this.priceCalendarRepository.create({
        date: currentDateStr,
        price,
        dayType,
        roomId,
        description, // 5. (เพิ่ม) ส่ง description เข้าไปตอนสร้าง Entity
      });
      pricesToCreate.push(newPriceEntry);
    }

    await this.priceCalendarRepository.save(pricesToCreate, { chunk: 100 });

    return {
      message: 'สร้างข้อมูลราคาสำเร็จ',
      count: pricesToCreate.length,
    };
  }

  // 6. (แก้ไข) ปรับแก้ Return Type ของฟังก์ชันให้รวม HolidayDescriptionThai ด้วย
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
      // API response ที่ได้จะมีข้อมูลครบถ้วน เราแค่ return มันออกไปทั้งหมด
      return response.data.result.data;
    } catch (error) {
      this.logger.error('Failed to fetch holidays from BOT API', error.stack);
      throw new InternalServerErrorException('ไม่สามารถดึงข้อมูลวันหยุดได้');
    }
  }
}