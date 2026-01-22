import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum Type {
  QR = "generate-qrcode",
  SLIP = "upload-slip",
}
export class FileUpload {
  @ApiProperty({ description: "เบอร์โทรศัพท์ผู้ใช้" })
  @IsString()
  @IsNotEmpty()
  userTell: string;

  @ApiProperty({ description: "ประเภท slip" })
  @IsString()
  @IsNotEmpty()
  @IsEnum(Type)
  type: Type;

  @ApiProperty({ description: "ประเภท slip" })
  @IsString()
  @IsNotEmpty()
  typeslip: string;

  @ApiProperty({ description: "ID จอง" })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}
