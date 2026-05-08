import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { Asset } from '../assets/entities/asset.entity';
import { AssetEntry } from '../entries/entities/asset-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardMember, Asset, AssetEntry]),
    UsersModule,
    AuthModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
