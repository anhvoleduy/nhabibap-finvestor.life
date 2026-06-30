import { Test, TestingModule } from '@nestjs/testing';
import { PriceQuoteDto } from '@nhabibap-myportfolio/shared-types';
import { PricesController } from './prices.controller';
import { PricesService } from './prices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const quote: PriceQuoteDto = {
  symbol: 'BTC',
  label: 'Bitcoin',
  price: 59214,
  unit: 'USD',
  changePct: -0.92,
  source: 'CoinGecko',
  updatedAt: '2026-06-30T00:00:00.000Z',
};

describe('PricesController', () => {
  let controller: PricesController;
  let service: jest.Mocked<PricesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricesController],
      providers: [
        {
          provide: PricesService,
          useValue: { getQuotes: jest.fn().mockResolvedValue([quote]) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PricesController);
    service = module.get(PricesService);
  });

  it('delegates to service.getQuotes', async () => {
    const result = await controller.list();
    expect(service.getQuotes).toHaveBeenCalled();
    expect(result).toEqual([quote]);
  });
});
