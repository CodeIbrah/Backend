import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialProfile } from '../interfaces/social-provider.interface';

@Injectable()
export class GitHubProvider implements SocialProvider {
  readonly name = 'github';
  readonly displayName = 'GitHub';
  readonly scopes = ['read:user', 'user:email'];

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('GITHUB_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET', '');
    this.redirectUri = this.configService.get<string>(
      'GITHUB_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/social/github/callback',
    );
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const resp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`GitHub token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as { access_token: string; error?: string };
    if (data.error) throw new Error(`GitHub OAuth error: ${data.error}`);
    return { accessToken: data.access_token };
  }

  async getProfile(accessToken: string): Promise<SocialProfile> {
    // Fetch primary profile
    const profileResp = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!profileResp.ok) throw new Error(`GitHub profile fetch failed: ${profileResp.status}`);
    const profile = (await profileResp.json()) as {
      id: number;
      email?: string;
      name?: string;
      avatar_url?: string;
      login: string;
    };

    // GitHub doesn't always return email in the user endpoint; fetch primary email separately
    let email = profile.email ?? null;
    if (!email) {
      try {
        const emailResp = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (emailResp.ok) {
          const emails = (await emailResp.json()) as Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>;
          const primary = emails.find((e) => e.primary && e.verified);
          if (primary) email = primary.email;
        }
      } catch {
        // email is optional
      }
    }

    return {
      provider: this.name,
      providerAccountId: String(profile.id),
      email,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatar_url ?? null,
      raw: profile,
    };
  }
}
