import { Test, TestingModule } from '@nestjs/testing';
import { CheckSlipController } from './check-slip.controller';
import { CheckSlipService } from './check-slip.service';

describe('CheckSlipController', () => {
  let controller: CheckSlipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckSlipController],
      providers: [CheckSlipService],
    }).compile();

    controller = module.get<CheckSlipController>(CheckSlipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
