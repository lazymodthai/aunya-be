import { Injectable, NotFoundException, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from '@/entities/settings.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

// Default settings keys
export enum SettingKey {
  MAX_GUESTS = 'maxGuests',
  EXTRA_BED_COUNT = 'extraBedCount',
  EXTRA_BED_PRICE = 'extraBedPrice',
  TOWEL_COUNT = 'towelCount',
  TOWEL_PRICE = 'towelPrice',
  AUTO_SLIP_VERIFICATION = 'autoSlipVerification',
  LINE_NOTIFICATION = 'lineNotification',
  ADVANCE_BOOKING_MONTHS = 'advanceBookingMonths',
}

// Default settings values
const DEFAULT_SETTINGS: { key: string; value: string; description: string }[] = [
  { key: SettingKey.MAX_GUESTS, value: '10', description: 'จำนวนผู้เข้าพักสูงสุด' },
  { key: SettingKey.EXTRA_BED_COUNT, value: '2', description: 'จำนวนที่นอนเสริมสูงสุด' },
  { key: SettingKey.EXTRA_BED_PRICE, value: '200', description: 'ราคาที่นอนเสริม (บาท)' },
  { key: SettingKey.TOWEL_COUNT, value: '10', description: 'จำนวนผ้าขนหนูสูงสุด' },
  { key: SettingKey.TOWEL_PRICE, value: '50', description: 'ราคาผ้าขนหนู (บาท)' },
  { key: SettingKey.AUTO_SLIP_VERIFICATION, value: 'true', description: 'เปิด/ปิด ระบบตรวจสลิปอัตโนมัติ' },
  { key: SettingKey.LINE_NOTIFICATION, value: 'true', description: 'เปิด/ปิด การส่ง LINE notification' },
  { key: SettingKey.ADVANCE_BOOKING_MONTHS, value: '6', description: 'จำนวนเดือนที่เปิดให้จองล่วงหน้า (เดือน)' },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly settingsRepository: Repository<SettingsEntity>,
  ) {}

  async onModuleInit() {
    await this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings() {
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await this.settingsRepository.findOne({
        where: { key: setting.key },
      });

      if (!existing) {
        await this.settingsRepository.save(
          this.settingsRepository.create(setting),
        );
      }
    }
  }

  async getAllSettings(): Promise<{ message: string; settings: SettingsEntity[] }> {
    const settings = await this.settingsRepository.find({
      order: { key: 'ASC' },
    });

    return {
      message: 'ดึงข้อมูล settings สำเร็จ',
      settings,
    };
  }

  async getSettingByKey(key: string): Promise<SettingsEntity> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`ไม่พบ setting: ${key}`);
    }

    return setting;
  }

  async updateSetting(key: string, updateSettingDto: UpdateSettingDto): Promise<{ message: string; setting: SettingsEntity }> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`ไม่พบ setting: ${key}`);
    }

    setting.value = updateSettingDto.value;
    const updatedSetting = await this.settingsRepository.save(setting);

    return {
      message: `อัปเดต setting "${key}" สำเร็จ`,
      setting: updatedSetting,
    };
  }

  async createSetting(createSettingDto: CreateSettingDto): Promise<{ message: string; setting: SettingsEntity }> {
    const existing = await this.settingsRepository.findOne({
      where: { key: createSettingDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting "${createSettingDto.key}" มีอยู่แล้ว`);
    }

    const newSetting = this.settingsRepository.create(createSettingDto);
    const savedSetting = await this.settingsRepository.save(newSetting);

    return {
      message: 'สร้าง setting สำเร็จ',
      setting: savedSetting,
    };
  }

  // Helper method to get setting value as number
  async getSettingAsNumber(key: string): Promise<number> {
    const setting = await this.getSettingByKey(key);
    return Number(setting.value);
  }

  // Helper method to get setting value as boolean
  async getSettingAsBoolean(key: string): Promise<boolean> {
    const setting = await this.getSettingByKey(key);
    return setting.value === 'true';
  }
}
