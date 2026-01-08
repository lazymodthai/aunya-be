import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class FileUpload {
  @ApiProperty({ description: 'เบอร์โทรศัพท์ผู้ใช้' })
  @IsString()
  @IsNotEmpty()
  userTell: string;

  @ApiProperty({ description: 'ประเภท slip' })
  @IsString()
  @IsNotEmpty()
  typeslip: string;

  @ApiProperty({ description: 'ID จอง' })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}