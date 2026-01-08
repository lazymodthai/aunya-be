import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SlipEntity } from "@/entities/slip.entity";
import { SaveSlipDto } from "./dto/saveslip-dto";

@Injectable()
export class CheckSlipService {
  constructor(
    @InjectRepository(SlipEntity)
    private readonly checkSlipRepository: Repository<SlipEntity>
  ) {}
  async SaveSlip(data:SaveSlipDto) {
    await this.checkSlipRepository.save(data);
  }
}
