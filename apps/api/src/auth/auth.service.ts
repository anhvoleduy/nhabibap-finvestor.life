import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import {
  AuthResponseDto,
  JwtPayloadDto,
  LoginDto,
  MessageResponseDto,
  RegisterDto,
} from '@nhabibap-myportfolio/shared-types';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<MessageResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    const user = await this.users.create(
      dto.email,
      passwordHash,
      dto.name,
      token,
      expiresAt,
    );
    await this.email.sendVerificationEmail(user.email, user.name, token);
    return {
      message: 'Account created. Check your email to verify your address.',
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.buildResponse(
      user.id,
      user.email,
      user.name,
      user.emailVerified,
    );
  }

  async verifyEmail(token: string): Promise<AuthResponseDto> {
    const user = await this.users.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Invalid verification token');
    if (
      user.emailVerificationTokenExpiresAt &&
      user.emailVerificationTokenExpiresAt.getTime() < Date.now()
    )
      throw new BadRequestException('Verification token expired');
    const verified = await this.users.markEmailVerified(user);
    return this.buildResponse(
      verified.id,
      verified.email,
      verified.name,
      verified.emailVerified,
    );
  }

  async resendVerification(email: string): Promise<MessageResponseDto> {
    const user = await this.users.findByEmail(email);
    // Don't reveal whether the email exists.
    if (user && !user.emailVerified) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
      await this.users.setVerificationToken(user, token, expiresAt);
      await this.email.sendVerificationEmail(user.email, user.name, token);
    }
    return {
      message: 'If the account exists and is unverified, an email was sent.',
    };
  }

  private buildResponse(
    id: string,
    email: string,
    name: string,
    emailVerified: boolean,
  ): AuthResponseDto {
    const payload: JwtPayloadDto = { sub: id, email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id, email, name, emailVerified },
    };
  }
}
