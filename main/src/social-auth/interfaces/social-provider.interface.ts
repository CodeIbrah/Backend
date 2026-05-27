/** Normalised profile returned by every provider */
export interface SocialProfile {
  provider: string;
  providerAccountId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  raw: Record<string, unknown>;
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/** Interface every social-login provider must implement */
export interface SocialProvider {
  /** Provider key — matches the URL segment and provider column */
  readonly name: string;
  /** Human-readable name for display */
  readonly displayName: string;
  /** OAuth scopes requested */
  readonly scopes: string[];
  /** Whether the required env vars are present */
  readonly isConfigured: boolean;

  /** Build the OAuth2 authorisation URL */
  getAuthUrl(state: string): string;

  /** Exchange an authorisation code for tokens */
  exchangeCode(code: string): Promise<TokenResult>;

  /** Refresh an expired access token (optional — some providers don't support it) */
  refreshAccessToken?(refreshToken: string): Promise<{ accessToken: string; expiresIn?: number }>;

  /** Fetch the user's profile with the access token */
  getProfile(accessToken: string): Promise<SocialProfile>;
}
