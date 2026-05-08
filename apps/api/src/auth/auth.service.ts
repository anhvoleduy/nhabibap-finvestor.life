import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import {
  AuthResponseDto,
  JwtPayloadDto,
  LoginDto,
  RegisterDto,
} from '@nhabibap-myportfolio/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create(dto.email, passwordHash, dto.name);
    return this.buildResponse(user.id, user.email, user.name);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.buildResponse(user.id, user.email, user.name);
  }

  private buildResponse(
    id: string,
    email: string,
    name: string,
  ): AuthResponseDto {
    const payload: JwtPayloadDto = { sub: id, email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id, email, name },
    };
  }
}
