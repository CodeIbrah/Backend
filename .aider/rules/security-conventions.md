# Security Conventions — backend-template

## Mandatory Rules
1. All user input validated via class-validator DTOs
2. Every authenticated endpoint uses @UseGuards(JwtAuthGuard)
3. Admin-only endpoints add @Roles('ADMIN') + RolesGuard
4. Never commit .env files or real secrets
5. No @ts-ignore or @ts-expect-error — fix types properly
6. Passwords hashed with bcrypt (salt rounds: 10)
7. Sensitive fields encrypted via CipherService (AES-256-GCM)
8. Refresh tokens always rotated — never reuse
9. Token reuse triggers full session revocation
10. Console.log only for non-DI services — prefer Winston logger
