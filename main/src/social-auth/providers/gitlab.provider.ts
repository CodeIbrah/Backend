import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialProfile } from '../interfaces/social-provider.interface';

@Injectable()
export class GitLabProvider implements SocialProvider {
  readonly name = 'gitlab';
  readonly displayName = 'GitLab';
  readonly scopes = ['read_user', 'openid', 'email'];

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GITLAB_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('GITLAB_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get<string>(
      'GITLAB_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/social/gitlab/callback',
    );
    this.baseUrl = this.configService.get<string>('GITLAB_BASE_URL', 'https://gitlab.com');
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
    });
    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    const resp = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`GitLab token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      created_at?: number;
    };
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const resp = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!resp.ok) throw new Error(`GitLab token refresh failed: ${resp.status}`);
    const data = (await resp.json()) as { access_token: string; expires_in?: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  async getProfile(accessToken: string): Promise<SocialProfile> {
    const resp = await fetch(`${this.baseUrl}/api/v4/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) throw new Error(`GitLab profile fetch failed: ${resp.status}`);
    const data = (await resp.json()) as {
      id: number;
      email?: string;
      name?: string;
      username: string;
      avatar_url?: string;
    };

    return {
      provider: this.name,
      providerAccountId: String(data.id),
      email: data.email ?? null,
      name: data.name ?? data.username,
      avatarUrl: data.avatar_url ?? null,
      raw: data,
    };
  }
}
