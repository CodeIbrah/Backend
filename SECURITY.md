# Security Policy

## Supported Versions

The following versions of Backend Template currently receive security updates:

| Version    | Supported |
| ---------- | --------- |
| 1.x (main) | Yes       |
| < 1.0      | No        |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please report it privately before disclosing it publicly.

**Do not report security vulnerabilities via public GitHub issues.**

To report a vulnerability:

1. Open a private security advisory at: https://github.com/CodeIbrah/Backend/security/advisories/new
2. Alternatively, email the project maintainers directly with details of the issue.
3. Include a clear description of the vulnerability, steps to reproduce, and potential impact.
4. If possible, include a suggested fix or mitigation.

### What to expect

- **Acknowledgment**: You will receive an acknowledgment of your report within 48 hours.
- **Investigation**: The maintainers will investigate and validate the reported issue within 5 business days.
- **Update**: You will receive updates on progress every 5 business days until the issue is resolved.
- **Disclosure**: Once fixed, we will coordinate a disclosure date with you. We aim to release fixes within 30 days of confirmation for high-severity issues.

We kindly ask that you allow us time to address the vulnerability before any public disclosure.

## Security Practices

This project implements the following security measures:

### Authentication

- JWT-based authentication with refresh token rotation
- OAuth2 support for Google, GitHub, Microsoft, Meta, GitLab, and Apple
- Social login account linking and unlinking
- Session management with configurable expiration

### Authorization

- Role-based access control (RBAC) with NestJS guards
- Endpoint-level permission checks
- Ownership validation for resource access

### Data Protection

- Passwords hashed with Argon2id
- AES-256 encryption at rest for sensitive data
- TLS in transit for all communications
- Input validation with class-validator and Zod schemas

### API Security

- Three-tier rate limiting (global, endpoint, user)
- CORS configured with strict origin whitelisting
- CSRF protection via tokens
- Helmet security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Request size limits and payload validation

### Audit & Monitoring

- Comprehensive audit trail for all sensitive operations
- Correlation ID propagation across services
- Real-time security event monitoring via the observability stack
- Automated alerting for suspicious patterns (rate limit breaches, brute force attempts)

### Infrastructure

- Docker containers running with least-privilege users
- Secrets managed via environment variables (never hardcoded)
- Automated dependency scanning via npm audit
- CI/CD pipeline with lint and type-check gates

## Dependency Vulnerabilities

We use automated tooling to monitor dependencies for known vulnerabilities:

- `npm audit` runs as part of the CI pipeline
- Critical and high-severity vulnerabilities are prioritized for immediate patching
- Dependencies are updated regularly via automated PRs

## Disclosure Policy

We follow a coordinated disclosure process:

1. Reporter submits vulnerability privately.
2. Maintainer triages and validates within 48 hours.
3. Fix is developed and tested internally.
4. Security patch is released, and the advisory is published.
5. Reporter is credited (if desired) in the advisory.

## Comments

<!-- This SECURITY.md follows GitHub's recommended format for security policies.
     It is reviewed and updated as the project's security posture evolves. -->
