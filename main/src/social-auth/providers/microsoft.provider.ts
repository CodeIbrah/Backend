import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialProfile } from '../interfaces/social-provider.interface';

@Injectable()
export class MicrosoftProvider implements SocialProvider {
  readonly name = 'microsoft';
  readonly displayName = 'Microsoft';
  readonly scopes = ['openid', 'email', 'profile', 'User.Read'];

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly tenant: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get<string>(
      'MICROSOFT_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/social/microsoft/callback',
    );
    this.tenant = this.configService.get<string>('MICROSOFT_TENANT', 'common');
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private get authority(): string {
    return `https://login.microsoftonline.com/${this.tenant}`;
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
      response_mode: 'query',
    });
    return `${this.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const resp = await fetch(`${this.authority}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Microsoft token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const resp = await fetch(`${this.authority}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!resp.ok) throw new Error(`Microsoft token refresh failed: ${resp.status}`);
    const data = (await resp.json()) as { access_token: string; expires_in?: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  async getProfile(accessToken: string): Promise<SocialProfile> {
    const resp = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) throw new Error(`Microsoft profile fetch failed: ${resp.status}`);
    const data = (await resp.json()) as {
      id: string;
      mail?: string;
      userPrincipalName?: string;
      displayName?: string;
      givenName?: string;
      surname?: string;
    };

    return {
      provider: this.name,
      providerAccountId: data.id,
      email: data.mail ?? data.userPrincipalName ?? null,
      name: data.displayName ?? null,
      avatarUrl: null, // Microsoft Graph requires a separate photo endpoint
      raw: data,
    };
  }
}
