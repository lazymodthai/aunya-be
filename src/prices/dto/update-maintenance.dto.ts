import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMaintenanceDto {
  @ApiProperty({
    type: Boolean,
    description: 'สถานะการปิดปรับปรุง',
  })
  @IsBoolean()
  isMaintenance: boolean;
}
