import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UsersService } from './users.service';
import { UserCleanupService } from './user-cleanup.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule],
  providers: [UsersService, UserCleanupService],
  exports: [UsersService],
})
export class UsersModule {}
