import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  const queryMock = jest.fn();

  beforeEach(async () => {
    queryMock.mockReset();
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: DataSource, useValue: { query: queryMock } },
      ],
    }).compile();
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('health', () => {
    it('returns ok status with timestamp', () => {
      const appController = app.get<AppController>(AppController);
      const result = appController.health();
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    });
  });

  describe('ready', () => {
    it('returns ok when DB query succeeds', async () => {
      queryMock.mockResolvedValueOnce([{ '?column?': 1 }]);
      const result = await app.get(AppController).ready();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('ok');
      expect(typeof result.latencyMs).toBe('number');
      expect(queryMock).toHaveBeenCalledWith('SELECT 1');
    });

    it('throws 503 when DB query fails', async () => {
      queryMock.mockRejectedValueOnce(new Error('connection refused'));
      await expect(app.get(AppController).ready()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
