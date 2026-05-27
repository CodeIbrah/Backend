import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialProfile } from '../interfaces/social-provider.interface';

@Injectable()
export class MetaProvider implements SocialProvider {
  readonly name = 'meta';
  readonly displayName = 'Meta (Facebook)';
  readonly scopes = ['email', 'public_profile'];

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('META_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('META_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get<string>(
      'META_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/social/meta/callback',
    );
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(','),
      state,
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const resp = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Meta token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as { access_token: string; expires_in?: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  async getProfile(accessToken: string): Promise<SocialProfile> {
    const resp = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,email,name,picture.type(large),first_name,last_name`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!resp.ok) throw new Error(`Meta profile fetch failed: ${resp.status}`);
    const data = (await resp.json()) as {
      id: string;
      email?: string;
      name?: string;
      picture?: { data?: { url?: string } };
      first_name?: string;
      last_name?: string;
    };

    return {
      provider: this.name,
      providerAccountId: data.id,
      email: data.email ?? null,
      name: data.name ?? null,
      avatarUrl: data.picture?.data?.url ?? null,
      raw: data,
    };
  }
}
