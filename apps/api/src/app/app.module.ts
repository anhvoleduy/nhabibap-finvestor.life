import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BoardsModule } from '../boards/boards.module';
import { AssetsModule } from '../assets/assets.module';
import { EntriesModule } from '../entries/entries.module';
import { CashFlowModule } from '../cash-flow/cash-flow.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DATABASE_HOST') ?? 'localhost',
        port: +(cfg.get('DATABASE_PORT') ?? 5432),
        username: cfg.get('DATABASE_USER') ?? 'appuser',
        password: cfg.get('DATABASE_PASSWORD') ?? 'apppass',
        database: cfg.get('DATABASE_NAME') ?? 'appdb',
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      }),
    }),
    AuthModule,
    UsersModule,
    BoardsModule,
    AssetsModule,
    EntriesModule,
    CashFlowModule,
  ],
})
export class AppModule {}
