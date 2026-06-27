import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { SocialCallbackDto } from './dto/social-auth-url.dto';

@ApiTags('auth / social')
@Controller('auth/social')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Get()
  @ApiOperation({ summary: 'List configured social providers' })
  getProviders(): Array<{ name: string; displayName: string; configured: boolean }> {
    return this.socialAuthService.getConfiguredProviders();
  }

  /* ── Static routes MUST be declared before `:provider` param route ── */

  @Get('accounts/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all linked social accounts for the current user' })
  async getUserAccounts(@CurrentUser('id') userId: string): Promise<unknown> {
    return this.socialAuthService.getUserAccounts(userId);
  }

  /* ── Dynamic provider routes ── */

  @Get(':provider')
  @ApiOperation({ summary: 'Get the OAuth2 authorization URL for a provider' })
  getAuthUrl(@Param('provider') provider: string): { url: string; state: string } {
    return this.socialAuthService.getAuthUrl(provider);
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'Handle OAuth2 callback (GET fallback)' })
  async callbackGet(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state?: string,
  ): Promise<Record<string, unknown>> {
    if (!code) {
      return { error: 'Missing authorization code' };
    }
    return this.socialAuthService.handleCallback(provider, code, state) as unknown as Promise<
      Record<string, unknown>
    >;
  }

  @Post(':provider/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle OAuth2 callback (POST — used by Apple)' })
  async callbackPost(
    @Param('provider') provider: string,
    @Body() body: SocialCallbackDto,
  ): Promise<Record<string, unknown>> {
    if (!body.code) {
      return { error: 'Missing authorization code' };
    }
    return this.socialAuthService.handleCallback(
      provider,
      body.code,
      body.state,
    ) as unknown as Promise<Record<string, unknown>>;
  }

  @Post(':provider/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a social account to the current user' })
  async linkAccount(
    @Param('provider') provider: string,
    @Body('code') code: string,
    @CurrentUser('id') userId: string,
  ): Promise<Record<string, unknown>> {
    if (!code) {
      return { error: 'Missing authorization code' };
    }
    return this.socialAuthService.linkAccount(userId, provider, code);
  }

  @Delete(':provider/unlink')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a social account from the current user' })
  async unlinkAccount(
    @Param('provider') provider: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.socialAuthService.unlinkAccount(userId, provider);
  }
}
