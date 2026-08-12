import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  UpdatePasswordDto,
  UpdateProfileDto,
} from '@nhabibap-myportfolio/shared-types';
import { User } from '../auth/entities/user.entity';
import { EmailService } from '../email/email.service';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  findById(id: string) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  findByVerificationToken(token: string) {
    return this.repo.findOneBy({ emailVerificationToken: token });
  }

  async searchByEmail(
    email: string,
  ): Promise<Pick<User, 'id' | 'email' | 'name'>[]> {
    return this.repo
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.name'])
      .where('u.email ILIKE :email', { email: `%${email}%` })
      .limit(10)
      .getMany();
  }

  async create(
    email: string,
    passwordHash: string,
    name: string,
    verificationToken: string,
    verificationTokenExpiresAt: Date,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');
    const user = this.repo.create({
      email,
      passwordHash,
      name,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
    });
    return this.repo.save(user);
  }

  async setVerificationToken(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<User> {
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpiresAt = expiresAt;
    return this.repo.save(user);
  }

  async markEmailVerified(user: User): Promise<User> {
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    return this.repo.save(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    let verificationToken: string | null = null;
    if (dto.email && dto.email !== user.email) {
      const conflict = await this.findByEmail(dto.email);
      if (conflict) throw new ConflictException('Email already in use');
      verificationToken = randomBytes(32).toString('hex');
      user.email = dto.email;
      user.emailVerified = false;
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpiresAt = new Date(
        Date.now() + TOKEN_TTL_MS,
      );
    }
    if (dto.name) user.name = dto.name;
    const saved = await this.repo.save(user);
    if (verificationToken) {
      await this.emailService.sendVerificationEmail(
        saved.email,
        saved.name,
        verificationToken,
      );
    }
    return saved;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password incorrect');
    if (dto.currentPassword === dto.newPassword)
      throw new BadRequestException('New password must differ from current');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repo.save(user);
  }
}
