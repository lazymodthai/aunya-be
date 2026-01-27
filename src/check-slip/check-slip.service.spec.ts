import { Test, TestingModule } from '@nestjs/testing';
import { CheckSlipService } from './check-slip.service';

describe('CheckSlipService', () => {
  let service: CheckSlipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckSlipService],
    }).compile();

    service = module.get<CheckSlipService>(CheckSlipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
