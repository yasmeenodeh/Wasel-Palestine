import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { RoleEntity } from '../../../database/entities/role.entity';
import { UserEntity } from '../../../database/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { PasswordPolicyService } from '../domain/password-policy.service';
import { TokenPayload } from '../domain/token-payload.type';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';
  private readonly maxFailedLoginAttempts = 5;
  private readonly lockMinutes = 15;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  async register(dto: RegisterDto) {
    this.passwordPolicyService.validate(dto.password);
    const requestedRole = dto.role ?? UserRole.CITIZEN;

    if (requestedRole !== UserRole.CITIZEN) {
      throw new BadRequestException('Self-registration is only allowed for citizen accounts.');
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ username: dto.username.trim() }, { email: dto.email.trim().toLowerCase() }],
    });

    if (existingUser) {
      throw new BadRequestException('Username or email is already in use.');
    }

    const role = await this.roleRepository.findOne({
      where: { name: requestedRole },
    });
    const resolvedRole =
      role ??
      (await this.roleRepository.save(
        this.roleRepository.create({
          name: UserRole.CITIZEN,
          description: 'Citizen reporter and subscriber',
        }),
      ));

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepository.save(
      this.userRepository.create({
        roleId: resolvedRole.id,
        fullName: dto.fullName.trim(),
        username: dto.username.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        refreshTokenHash: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
      }),
    );

    return this.createAuthResponse(await this.findUserWithRole(user.id));
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier.toLowerCase() }],
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    this.ensureUserCanAuthenticate(user);

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      await this.registerFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    return this.createAuthResponse(await this.findUserWithRole(user.id));
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyToken(dto.refreshToken, 'refresh');
    const user = await this.findUserWithRole(payload.sub);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const refreshMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);

    if (!refreshMatches) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    return this.createAuthResponse(user);
  }

  async logout(dto: LogoutDto) {
    const payload = await this.verifyToken(dto.refreshToken, 'refresh');
    const user = await this.findUserWithRole(payload.sub);

    if (user.refreshTokenHash) {
      const refreshMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);

      if (refreshMatches) {
        await this.userRepository.update(user.id, {
          refreshTokenHash: null,
        });
      }
    }

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.findUserWithRole(userId);

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async verifyAccessToken(token: string) {
    return this.verifyToken(token, 'access');
  }

  private async createAuthResponse(user: UserEntity) {
    const accessPayload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name as UserRole,
      type: 'access',
    };
    const refreshPayload: TokenPayload = {
      ...accessPayload,
      type: 'refresh',
    };
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'wasel_access_secret',
      expiresIn: this.accessTokenExpiresIn,
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'wasel_refresh_secret',
      expiresIn: this.refreshTokenExpiresIn,
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.userRepository.update(user.id, {
      refreshTokenHash,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
      },
    };
  }

  private async verifyToken(token: string, type: 'access' | 'refresh') {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret:
          type === 'access'
            ? process.env.JWT_ACCESS_SECRET ?? 'wasel_access_secret'
            : process.env.JWT_REFRESH_SECRET ?? 'wasel_refresh_secret',
      });

      if (payload.type !== type) {
        throw new UnauthorizedException('Token type is invalid.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token is invalid or expired.');
    }
  }

  private ensureUserCanAuthenticate(user: UserEntity) {
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new HttpException('Account is temporarily locked. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async registerFailedLogin(user: UserEntity) {
    const nextAttempts = user.failedLoginAttempts + 1;
    const lockUntil =
      nextAttempts >= this.maxFailedLoginAttempts
        ? new Date(Date.now() + this.lockMinutes * 60 * 1000)
        : null;

    await this.userRepository.update(user.id, {
      failedLoginAttempts: nextAttempts >= this.maxFailedLoginAttempts ? 0 : nextAttempts,
      lockedUntil: lockUntil,
    });
  }

  private async findUserWithRole(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User was not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    return user;
  }
}
