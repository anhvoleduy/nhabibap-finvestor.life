import {
  Controller,
  Get,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { Public } from '../common/decorators/public.decorator';

const READY_QUERY_TIMEOUT_MS = 2000;

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Root' })
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: HttpStatus.OK })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe (DB connectivity)' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE })
  async ready() {
    const start = Date.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('db query timeout')),
          READY_QUERY_TIMEOUT_MS,
        );
      });
      await Promise.race([this.dataSource.query('SELECT 1'), timeout]);
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        db: 'fail',
        error: (err as Error).message,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
    return {
      status: 'ok',
      db: 'ok',
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }
}
