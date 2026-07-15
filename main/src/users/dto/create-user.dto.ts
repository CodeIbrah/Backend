import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'User name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'User role', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Initial password (omit for invite/social-only users)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}
