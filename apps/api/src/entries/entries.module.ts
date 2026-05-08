import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntry } from './entities/asset-entry.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { Asset } from '../assets/entities/asset.entity';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntry, NavSnapshot, Asset]),
    BoardsModule,
    AuthModule,
  ],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
