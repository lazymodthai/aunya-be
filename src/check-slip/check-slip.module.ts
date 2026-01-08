import { Module } from "@nestjs/common";
import { CheckSlipService } from "./check-slip.service";
import { CheckSlipController } from "./check-slip.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SlipEntity } from "@/entities/slip.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SlipEntity])],
  controllers: [CheckSlipController],
  providers: [CheckSlipService],
  exports: [CheckSlipService],
})
export class CheckSlipModule {}
