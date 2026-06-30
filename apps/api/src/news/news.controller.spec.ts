import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType } from '@nhabibap-myportfolio/shared-types';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const item = {
  title: 'Gold up',
  url: 'https://x/1',
  source: 'CafeF',
  publishedAt: null,
};

describe('NewsController', () => {
  let controller: NewsController;
  let service: jest.Mocked<NewsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [
        {
          provide: NewsService,
          useValue: { getNews: jest.fn().mockResolvedValue([item]) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(NewsController);
    service = module.get(NewsService);
  });

  it('delegates a valid type to service.getNews', async () => {
    const result = await controller.list(CategoryType.GOLD);
    expect(service.getNews).toHaveBeenCalledWith(CategoryType.GOLD);
    expect(result).toEqual([item]);
  });

  it('rejects an unknown type with 400', () => {
    expect(() => controller.list('BOGUS' as CategoryType)).toThrow(
      BadRequestException,
    );
    expect(service.getNews).not.toHaveBeenCalled();
  });
});
