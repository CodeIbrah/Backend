import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AnalyticsEventType } from '@prisma/client';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  tokens: Tokens;
}

@Injectable()
export class AuthService {
  private readonly logger = {
    log: (message: string) => console.log(`[AuthService] ${message}`),
    error: (message: string) => console.error(`[AuthService] ${message}`),
    warn: (message: string) => console.warn(`[AuthService] ${message}`),
  };

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.REGISTER,
      userId: user.id,
      metadata: { email: user.email },
    });

    await this.activityLogService.logActivity({
      userId: user.id,
      type: 'USER_CREATED',
      action: 'User registered',
      description: `New user registered: ${email}`,
      metadata: { email: user.email, name },
      severity: 'INFO',
    });

    this.logger.log(`User registered: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password);
    if (!user) {
      await this.trackAnalyticsEvent({
        type: AnalyticsEventType.FAILED_AUTH,
        metadata: { email, reason: 'invalid_credentials' },
      });

      await this.activityLogService.logLogin('unknown', false, {
        email,
        reason: 'invalid_credentials',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.role);

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.LOGIN,
      userId: user.id,
      metadata: { email: user.email },
    });

    await this.activityLogService.logLogin(user.id, true, {
      email: user.email,
    });

    this.logger.log(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: Tokens }> {
    // 1. Verify JWT signature + expiration
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // 2. Compute SHA-256 hash of the raw token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 3. Lookup in DB — if missing, the token was already rotated or revoked
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token has been revoked or reused');
    }

    // 4. Check expiry
    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // 5. Check if already revoked (token theft detection)
    if (stored.revokedAt) {
      // Token reuse detected — revoke ALL tokens for this user (compromised)
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
    }

    // 6. Revoke this specific token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // 7. Verify user is still active
    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 8. Issue new token pair
    const tokens = await this.generateTokens(user.id, user.role);

    return { tokens };
  }

  async logout(userId: string): Promise<void> {
    // Revoke ALL refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.activityLogService.logLogout(userId);

    this.logger.log(`User logged out: ${userId}`);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }

    if (!user.password) return null;
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async getTokens(userId: string, role: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          type: 'refresh',
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '30d',
          ),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Generate tokens AND persist the refresh token hash to the database
   * for rotation + revocation support.
   */
  private async generateTokens(userId: string, role: string): Promise<Tokens> {
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    // Persist refresh token hash to DB
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const parsedExpiry = parseExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: parsedExpiry,
      },
    }).catch((err) => {
      this.logger.error(`Failed to persist refresh token: ${(err as Error).message}`);
    });

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async trackAnalyticsEvent(event: {
    type: AnalyticsEventType;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          metadata: event.metadata || {},
          service: this.configService.get<string>('OTEL_SERVICE_NAME'),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to track analytics event: ${event.type}`,
      );
    }
  }
}

/** Parse '7d', '30d', '1h' style expiry strings into a Date (native Date) */
function parseExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  const ms = (multipliers[unit] ?? 30 * 24 * 60 * 60 * 1000) * value;
  return new Date(Date.now() + ms);
}
