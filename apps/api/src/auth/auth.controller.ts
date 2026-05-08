import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  UserDto,
} from '@nhabibap-myportfolio/shared-types';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, type: UserDto })
  me(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.sub);
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by email' })
  @ApiResponse({ status: 200, type: [UserDto] })
  search(@Query('email') email: string) {
    return this.usersService.searchByEmail(email ?? '');
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserDto })
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Patch('me/password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({ status: 204 })
  updatePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(req.user.sub, dto);
  }
}
