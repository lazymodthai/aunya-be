import { Controller, Get, Patch, Post, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { SettingsService, SettingKey } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { CreateSettingDto } from './dto/create-setting.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all settings',
    description: 'ดึงข้อมูล settings ทั้งหมด',
  })
  @ApiOkResponse({
    description: 'Settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        settings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('keys')
  @ApiOperation({
    summary: 'Get available setting keys',
    description: 'ดึง keys ที่ใช้ได้ทั้งหมด',
  })
  @HttpCode(HttpStatus.OK)
  getSettingKeys() {
    return {
      message: 'Setting keys',
      keys: Object.values(SettingKey),
    };
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Get setting by key',
    description: 'ดึงข้อมูล setting ตาม key',
  })
  @ApiParam({
    name: 'key',
    description: 'Setting key',
    example: 'maxGuests',
  })
  @HttpCode(HttpStatus.OK)
  getSettingByKey(@Param('key') key: string) {
    return this.settingsService.getSettingByKey(key);
  }

  @Patch(':key')
  @ApiOperation({
    summary: 'Update setting by key',
    description: 'อัปเดตค่า setting ตาม key',
  })
  @ApiParam({
    name: 'key',
    description: 'Setting key',
    example: 'maxGuests',
  })
  @ApiBody({
    type: UpdateSettingDto,
    description: 'Setting value to update',
  })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  updateSetting(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.updateSetting(key, updateSettingDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new setting',
    description: 'สร้าง setting ใหม่',
  })
  @ApiBody({
    type: CreateSettingDto,
    description: 'Setting data',
  })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  createSetting(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.createSetting(createSettingDto);
  }
}
