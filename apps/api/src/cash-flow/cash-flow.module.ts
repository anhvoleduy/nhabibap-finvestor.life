import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashFlowEntry } from './entities/cash-flow-entry.entity';
import { CashFlowController } from './cash-flow.controller';
import { CashFlowService } from './cash-flow.service';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashFlowEntry]),
    BoardsModule,
    AuthModule,
  ],
  controllers: [CashFlowController],
  providers: [CashFlowService],
})
export class CashFlowModule {}
