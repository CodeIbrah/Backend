FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY main/package.json ./main/
COPY microservices/auth-service/package.json ./microservices/auth-service/
COPY microservices/users-service/package.json ./microservices/users-service/
COPY microservices/notifications-service/package.json ./microservices/notifications-service/
COPY microservices/payment-service/package.json ./microservices/payment-service/
COPY packages/shared-ai/package.json ./packages/shared-ai/
COPY packages/shared-analytics/package.json ./packages/shared-analytics/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-reports/package.json ./packages/shared-reports/
COPY packages/shared-telemetry/package.json ./packages/shared-telemetry/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

RUN npm install

COPY . .

RUN cd main && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --from=builder --chown=nodejs:nodejs /app/main/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/main/package.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]
