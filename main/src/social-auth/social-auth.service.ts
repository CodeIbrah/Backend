import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CipherService } from '../cipher/cipher.service';
import { GoogleProvider } from './providers/google.provider';
import { MetaProvider } from './providers/meta.provider';
import { MicrosoftProvider } from './providers/microsoft.provider';
import { GitHubProvider } from './providers/github.provider';
import { GitLabProvider } from './providers/gitlab.provider';
import { AppleProvider } from './providers/apple.provider';
import { SocialProvider } from './interfaces/social-provider.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SocialLoginResult {
  isNew: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  tokens: AuthTokens;
  socialAccount: {
    id: string;
    provider: string;
    providerAccountId: string;
  };
}

@Injectable()
export class SocialAuthService {
  private readonly logger = new Logger(SocialAuthService.name);
  private readonly providers = new Map<string, SocialProvider>();
  /** In-memory state store — replace with Redis in production */
  private readonly stateStore = new Map<string, { createdAt: number }>();

  constructor(
    readonly googleProvider: GoogleProvider,
    readonly metaProvider: MetaProvider,
    readonly microsoftProvider: MicrosoftProvider,
    readonly githubProvider: GitHubProvider,
    readonly gitlabProvider: GitLabProvider,
    readonly appleProvider: AppleProvider,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityLogService: ActivityLogService,
    private readonly cipher: CipherService,
  ) {
    this.registerProvider(googleProvider);
    this.registerProvider(metaProvider);
    this.registerProvider(microsoftProvider);
    this.registerProvider(githubProvider);
    this.registerProvider(gitlabProvider);
    this.registerProvider(appleProvider);
  }

  private registerProvider(provider: SocialProvider): void {
    if (provider.isConfigured) {
      this.providers.set(provider.name, provider);
      this.logger.log(`Social provider registered: ${provider.displayName}`);
    } else {
      this.logger.warn(`Social provider NOT configured: ${provider.displayName} (missing env vars)`);
    }
  }

  /** List all configured providers with their status */
  getConfiguredProviders(): Array<{ name: string; displayName: string; configured: boolean }> {
    return [
      this.googleProvider,
      this.metaProvider,
      this.microsoftProvider,
      this.githubProvider,
      this.gitlabProvider,
      this.appleProvider,
    ].map((p) => ({
      name: p.name,
      displayName: p.displayName,
      configured: p.isConfigured,
    }));
  }

  /** Get a provider by name */
  getProvider(name: string): SocialProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(
        `Provider "${name}" not configured. Available: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    }
    return provider;
  }

  /**
   * Step 1: Generate the OAuth2 authorization URL.
   * Stores `state` in-memory to validate on callback (CSRF protection).
   */
  getAuthUrl(providerName: string): { url: string; state: string } {
    const provider = this.getProvider(providerName);
    const state = crypto.randomUUID();

    this.stateStore.set(state, { createdAt: Date.now() });
    // Clean old states (older than 10 minutes)
    for (const [key, val] of this.stateStore) {
      if (Date.now() - val.createdAt > 600_000) this.stateStore.delete(key);
    }

    const url = provider.getAuthUrl(state);
    return { url, state };
  }

  /**
   * Step 2: Handle the OAuth2 callback.
   * - Exchange code for tokens
   * - Fetch profile from provider
   * - Find or create user
   * - Return JWT tokens
   */
  async handleCallback(
    providerName: string,
    code: string,
    state?: string,
  ): Promise<SocialLoginResult> {
    const provider = this.getProvider(providerName);

    // Validate state (CSRF)
    if (state && !this.stateStore.has(state)) {
      throw new UnauthorizedException('Invalid or expired state parameter');
    }
    if (state) this.stateStore.delete(state);

    // Exchange code for tokens
    const tokenResult = await provider.exchangeCode(code);

    // Fetch profile
    const profile = await provider.getProfile(tokenResult.accessToken);

    if (!profile.email && providerName !== 'apple') {
      throw new BadRequestException(
        `Provider ${providerName} did not return an email address. Ensure the email scope is granted.`,
      );
    }

    // Check if social account already exists
    const existingAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerName,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // Update tokens
      await this.prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: this.cipher.encryptToString(tokenResult.accessToken) ?? tokenResult.accessToken,
          refreshToken: this.cipher.encryptToString(tokenResult.refreshToken) ?? (tokenResult.refreshToken ?? existingAccount.refreshToken),
          tokenExpiresAt: tokenResult.expiresIn
            ? new Date(Date.now() + tokenResult.expiresIn * 1000)
            : null,
          profileData: profile.raw as Prisma.InputJsonValue,
          avatarUrl: profile.avatarUrl,
          name: profile.name ?? existingAccount.name,
        },
      });

      const tokens = await this.generateTokens(existingAccount.user.id, existingAccount.user.role);

      await this.logActivity(existingAccount.user.id, `${providerName}:login`);

      return {
        isNew: false,
        user: {
          id: existingAccount.user.id,
          email: existingAccount.user.email,
          name: existingAccount.user.name ?? profile.name,
          role: existingAccount.user.role,
        },
        tokens,
        socialAccount: {
          id: existingAccount.id,
          provider: providerName,
          providerAccountId: profile.providerAccountId,
        },
      };
    }

    // Check if a user with this email already exists
    let userId: string;
    let userRole: string;
    let userEmail: string;

    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        userId = existingUser.id;
        userRole = existingUser.role;
        userEmail = existingUser.email;
      } else {
        // Create new user
        const newUser = await this.prisma.user.create({
          data: {
            email: profile.email,
            password: null,
            name: profile.name,
          },
        });
        userId = newUser.id;
        userRole = newUser.role;
        userEmail = newUser.email;
      }
    } else {
      // No email — create a placeholder for Apple users (Apple hides email sometimes)
      const placeholderEmail = `${profile.providerAccountId}@${providerName}.social`;
      const newUser = await this.prisma.user.create({
        data: {
          email: placeholderEmail,
          password: null,
          name: profile.name ?? `${providerName}-user`,
        },
      });
      userId = newUser.id;
      userRole = newUser.role;
      userEmail = newUser.email;
    }

    // Link social account
    const socialAccount = await this.prisma.socialAccount.create({
      data: {
        userId,
        provider: providerName,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        accessToken: this.cipher.encryptToString(tokenResult.accessToken) ?? tokenResult.accessToken,
        refreshToken: this.cipher.encryptToString(tokenResult.refreshToken) ?? tokenResult.refreshToken ?? null,
        tokenExpiresAt: tokenResult.expiresIn
          ? new Date(Date.now() + tokenResult.expiresIn * 1000)
          : null,
          profileData: profile.raw as Prisma.InputJsonValue,
        },
      });

    const tokens = await this.generateTokens(userId, userRole);

    await this.logActivity(userId, `${providerName}:register`);

    return {
      isNew: true,
      user: {
        id: userId,
        email: userEmail,
        name: profile.name,
        role: userRole,
      },
      tokens,
      socialAccount: {
        id: socialAccount.id,
        provider: providerName,
        providerAccountId: profile.providerAccountId,
      },
    };
  }

  /** Link an additional social account to an existing user */
  async linkAccount(
    userId: string,
    providerName: string,
    code: string,
  ): Promise<SocialLoginResult['socialAccount']> {
    const provider = this.getProvider(providerName);

    const tokenResult = await provider.exchangeCode(code);
    const profile = await provider.getProfile(tokenResult.accessToken);

    const existing = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerName,
          providerAccountId: profile.providerAccountId,
        },
      },
    });

    if (existing) {
      if (existing.userId === userId) {
        throw new ConflictException('This social account is already linked to your profile');
      }
      throw new ConflictException('This social account is linked to another user');
    }

    const socialAccount = await this.prisma.socialAccount.create({
      data: {
        userId,
        provider: providerName,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        accessToken: this.cipher.encryptToString(tokenResult.accessToken) ?? tokenResult.accessToken,
        refreshToken: this.cipher.encryptToString(tokenResult.refreshToken) ?? tokenResult.refreshToken ?? null,
        tokenExpiresAt: tokenResult.expiresIn
          ? new Date(Date.now() + tokenResult.expiresIn * 1000)
          : null,
          profileData: profile.raw as Prisma.InputJsonValue,
        },
      });

    await this.logActivity(userId, `${providerName}:link`);

    return {
      id: socialAccount.id,
      provider: providerName,
      providerAccountId: profile.providerAccountId,
    };
  }

  /** Unlink a social account */
  async unlinkAccount(userId: string, providerName: string): Promise<void> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { userId, provider: providerName },
    });

    if (!account) {
      throw new BadRequestException(`No ${providerName} account linked to your profile`);
    }

    // Don't allow unlinking if user has no password and this is their only auth method
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: true },
    });

    if (user && !user.password && user.socialAccounts.length <= 1) {
      throw new BadRequestException(
        'Cannot unlink your only social account. Set a password first or link another account.',
      );
    }

    await this.prisma.socialAccount.delete({ where: { id: account.id } });
    await this.logActivity(userId, `${providerName}:unlink`);
  }

  /** List social accounts linked to a user */
  async getUserAccounts(userId: string): Promise<unknown> {
    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return accounts;
  }

  private async generateTokens(userId: string, role: string): Promise<AuthTokens> {
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

    // Persist refresh token hash (same rotation logic as AuthService)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const parsedExpiry = parseExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt: parsedExpiry },
    }).catch((err) => {
      this.logger.error(`Failed to persist refresh token: ${(err as Error).message}`);
    });

    return { accessToken, refreshToken };
  }

  private async logActivity(userId: string, action: string): Promise<void> {
    try {
      await this.activityLogService.logActivity({
        userId,
        type: 'LOGIN',
        action,
        description: `Social login: ${action}`,
        severity: 'INFO',
      });
    } catch {
      // Non-critical
    }
  }
}

/** Parse '7d', '30d', '1h' style expiry strings into a Date */
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
