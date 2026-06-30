import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BoardsModule } from '../boards/boards.module';
import { AssetsModule } from '../assets/assets.module';
import { EntriesModule } from '../entries/entries.module';
import { CashFlowModule } from '../cash-flow/cash-flow.module';
import { NewsModule } from '../news/news.module';
import { PricesModule } from '../prices/prices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('DATABASE_URL');
        const sslEnabled = url
          ? cfg.get<string>('DATABASE_SSL') !== 'false'
          : cfg.get<string>('DATABASE_SSL') === 'true';
        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: cfg.get<string>('DATABASE_HOST') ?? 'localhost',
                port: +(cfg.get<string>('DATABASE_PORT') ?? 5432),
                username: cfg.get<string>('DATABASE_USER') ?? 'appuser',
                password: cfg.get<string>('DATABASE_PASSWORD') ?? 'apppass',
                database: cfg.get<string>('DATABASE_NAME') ?? 'appdb',
              }),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: false,
          migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        };
      },
    }),
    AuthModule,
    UsersModule,
    BoardsModule,
    AssetsModule,
    EntriesModule,
    CashFlowModule,
    NewsModule,
    PricesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
