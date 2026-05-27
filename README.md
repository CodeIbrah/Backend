# Backend Template

**Enterprise-Ready Backend with Hybrid Monolith + Microservices Architecture**

A production-grade backend template built with NestJS and Express, featuring a hybrid architecture that combines a feature-rich monolith with independent microservices. Includes comprehensive observability, AI-powered error diagnosis, analytics, queue-based processing, and automated incident response.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Observability](#observability)
- [AI Error Doctor System](#ai-error-doctor-system)
- [Analytics System](#analytics-system)
- [Queue System](#queue-system)
- [Alert System](#alert-system)
- [Automatic Reports](#automatic-reports)
- [Security](#security)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Architecture Overview

The system follows a hybrid architecture combining a feature-rich monolith with independent microservices:

`+-----------------------------------------------------------------------------------------+
|                              HYBRID ARCHITECTURE                                        |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MAIN MONOLITH                              |       |
|  |                                                                             |       |
|  |  +-----------------------------------------------------------------+       |       |
|  |  |                        CORE DOMAIN SERVICES                        |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Auth        |  | Users       |  | Products    |  | Orders      |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  |                                                                         |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  |  |                        SUPPORTING SERVICES                        |   |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Logging     |  | Telemetry   |  | Queue       |  | Reports     |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MICROSERVICES                                        |
|  |                                                                             |       |
|  |  +-----------------------------------------------------------------+       |       |
|  |  |                        INDEPENDENT SERVICES                        |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Auth        |  | Notifications|  | Payment     |  | Inventory   |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+`
backend-template/
+-- main/ # Main monolith application
+-- microservices/ # Independent microservices
| +-- auth-service/ # Authentication service
| +-- notifications-service/ # Notifications service
| +-- payment-service/ # Payment processing service
| +-- users-service/ # User management service
+-- gateway/ # API Gateway
+-- infrastructure/ # Infrastructure configuration
+-- scripts/ # Utility scripts
+-- reports/ # Automatic reports
+-- skills/ # AI agent skills
+-- context/ # Contextual information
+-- docs/ # Documentation
+-- .env.example # Environment variables template
+-- package.json # Project dependencies
+-- README.md # Project documentation
`

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Start the development server: `npm run dev`

## Development Setup

1. Install Node.js (v20+)
2. Install PostgreSQL
3. Install Redis
4. Install Docker (for infrastructure)

## Environment Variables

Create a .env file based on .env.example and configure:

`

# Database

DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis

REDIS_URL=redis://localhost:6379

# JWT

JWT_SECRET=your_jwt_secret

# Stripe

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Observability

PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000
LOKI_URL=http://localhost:3100
JAEGER_URL=http://localhost:16686

# AI System

AI_DOCTOR_API_KEY=your_ai_doctor_api_key
`

## API Endpoints

The system exposes the following main endpoints:

- **Auth Service**: /api/auth
- **Users Service**: /api/users
- **Payment Service**: /api/payments
- **Notifications Service**: /api/notifications
- **Inventory Service**: /api/inventory

## Observability

The system includes comprehensive observability features:

- **Metrics**: Prometheus for metrics collection
- **Logs**: Winston + Loki for log aggregation
- **Traces**: OpenTelemetry + Jaeger for distributed tracing
- **Dashboards**: Grafana for visualization

## AI Error Doctor System

The AI Error Doctor system provides automated error diagnosis and incident response:

- **Error Analysis**: AI-powered error analysis and root cause identification
- **Incident Response**: Automated incident response and resolution
- **Error Patterns**: Detection of recurring error patterns
- **Recommendations**: Actionable recommendations for error resolution

## Analytics System

The analytics system provides comprehensive insights into system performance and user behavior:

- **User Analytics**: Tracking of user activity and behavior
- **Performance Analytics**: Monitoring of system performance metrics
- **Error Analytics**: Analysis of error patterns and trends
- **Business Analytics**: Insights into business metrics and KPIs

## Queue System

The queue system handles asynchronous processing and background jobs:

- **Job Processing**: Processing of background jobs
- **Job Scheduling**: Scheduling of recurring jobs
- **Job Monitoring**: Monitoring of job status and progress

## Alert System

The alert system provides real-time notifications and alerts:

- **Alert Types**: Various types of alerts (error, warning, info)
- **Alert Channels**: Multiple alert channels (email, Slack, PagerDuty)
- **Alert Escalation**: Alert escalation policies

## Automatic Reports

The system generates automatic reports for monitoring and analysis:

- **Performance Reports**: Reports on system performance
- **Error Reports**: Reports on error patterns and trends
- **Business Reports**: Reports on business metrics and KPIs

## Security

The system includes comprehensive security features:

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Data Protection**: Encryption of sensitive data
- **Security Audits**: Regular security audits and vulnerability scanning

## Testing

The system includes comprehensive testing:

- **Unit Tests**: Unit tests for individual components
- **Integration Tests**: Integration tests for component interactions
- **End-to-End Tests**: End-to-end tests for user flows
- **Load Testing**: Load testing for performance evaluation

## Docker Setup

The system includes Docker configuration for easy deployment:

- **Docker Compose**: Multi-container Docker setup
- **Docker Images**: Pre-built Docker images
- **Docker Hub**: Docker images available on Docker Hub

## Troubleshooting

Common issues and solutions:

- **Issue**: Application not starting
  **Solution**: Check logs and ensure all dependencies are installed

- **Issue**: Database connection errors
  **Solution**: Verify database credentials and connection URL

- **Issue**: API endpoint not working
  **Solution**: Check API Gateway configuration and microservice status

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
