import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetCategory } from './entities/asset-category.entity';
import { Asset } from './entities/asset.entity';
import { GoldBuy } from './entities/gold-buy.entity';
import { CryptoBuy } from './entities/crypto-buy.entity';
import { AssetEntry } from '../entries/entities/asset-entry.entity';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetCategory,
      Asset,
      AssetEntry,
      GoldBuy,
      CryptoBuy,
    ]),
    BoardsModule,
    AuthModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
