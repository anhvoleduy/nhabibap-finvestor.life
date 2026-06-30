import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  name!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  emailVerified!: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;
}

export class JwtPayloadDto {
  @ApiProperty()
  sub!: string;

  @ApiProperty()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
