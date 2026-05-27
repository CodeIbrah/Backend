import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialProvider, SocialProfile } from '../interfaces/social-provider.interface';

/**
 * Sign in with Apple follows the standard OAuth2 + OpenID Connect flow,
 * but uses a "response_mode=form_post" by default and returns the user
 * info in a JWT id_token rather than a separate API call.
 */
@Injectable()
export class AppleProvider implements SocialProvider {
  readonly name = 'apple';
  readonly displayName = 'Apple';
  readonly scopes = ['name', 'email'];

  private readonly clientId: string;
  private readonly teamId: string;
  private readonly keyId: string;
  private readonly privateKey: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('APPLE_CLIENT_ID', '');         // Service ID / Bundle ID
    this.teamId = this.configService.get<string>('APPLE_TEAM_ID', '');
    this.keyId = this.configService.get<string>('APPLE_KEY_ID', '');
    this.privateKey = this.configService.get<string>('APPLE_PRIVATE_KEY', '');      // .p8 file content
    this.redirectUri = this.configService.get<string>(
      'APPLE_REDIRECT_URI',
      'http://localhost:3000/api/v1/auth/social/apple/callback',
    );
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.teamId && this.keyId && this.privateKey);
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code id_token',
      scope: this.scopes.join(' '),
      state,
      response_mode: 'form_post',
    });
    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    // Apple requires a client_secret generated from the private key
    const clientSecret = await this.generateClientSecret();

    const resp = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Apple token exchange failed: ${resp.status} ${body}`);
    }

    const data = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      id_token?: string;
    };
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
    const clientSecret = await this.generateClientSecret();

    const resp = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!resp.ok) throw new Error(`Apple token refresh failed: ${resp.status}`);
    const data = (await resp.json()) as { access_token: string; expires_in?: number };
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }

  async getProfile(accessToken: string): Promise<SocialProfile> {
    // Apple does not have a userinfo endpoint that returns profile data.
    // Profile info comes in the id_token (JWT) during initial auth.
    // For subsequent calls, we return provider info only.
    return {
      provider: this.name,
      providerAccountId: 'apple-user', // will be overridden by id_token sub claim
      email: null,
      name: null,
      avatarUrl: null,
      raw: { note: 'Apple profile data only available in initial id_token' },
    };
  }

  private async generateClientSecret(): Promise<string> {
    // In production, use jsonwebtoken to sign a JWT with the Apple private key.
    // This template provides the skeleton; jwt signing requires the `jsonwebtoken` package.
    // For now, return a placeholder — actual implementation:
    //
    // const jwt = require('jsonwebtoken');
    // const now = Math.floor(Date.now() / 1000);
    // const token = jwt.sign(
    //   {
    //     iss: this.teamId,
    //     iat: now,
    //     exp: now + 86400 * 180, // 6 months (Apple max)
    //     aud: 'https://appleid.apple.com',
    //     sub: this.clientId,
    //   },
    //   this.privateKey,
    //   { algorithm: 'ES256', keyid: this.keyId },
    // );
    // return token;

    if (!this.privateKey) {
      throw new Error('Apple client_secret generation requires APPLE_PRIVATE_KEY. Install jsonwebtoken and implement the JWT signing logic.');
    }
    throw new Error('Apple client_secret generation requires the `jsonwebtoken` package. Run: npm install jsonwebtoken');
  }

  /**
   * Decode an Apple ID token to extract user profile info.
   * The id_token is a JWT containing the user's email and sub claim.
   */
  decodeIdToken(idToken: string): { sub: string; email?: string } {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) throw new Error('Invalid id_token format');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      return { sub: payload.sub, email: payload.email };
    } catch {
      throw new Error('Failed to decode Apple id_token');
    }
  }
}
