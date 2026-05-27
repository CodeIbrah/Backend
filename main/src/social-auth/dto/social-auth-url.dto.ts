import { ApiProperty } from '@nestjs/swagger';

export class SocialAuthUrlDto {
  @ApiProperty({ description: 'OAuth2 authorization URL' })
  url!: string;

  @ApiProperty({ description: 'State parameter for CSRF validation' })
  state!: string;
}

export class SocialCallbackDto {
  @ApiProperty({ description: 'Authorization code from provider' })
  code!: string;

  @ApiProperty({ description: 'State parameter for CSRF validation', required: false })
  state?: string;
}

export class SocialAccountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  providerAccountId!: string;

  @ApiProperty({ nullable: true })
  email!: string | null;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
