# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /build

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules /prod_modules
RUN npm ci

COPY tsconfig*.json ./
COPY src/ src/

RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini openssl ca-certificates && \
    addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app

# Copy production dependencies
COPY --from=builder /prod_modules node_modules/
COPY --from=builder /build/dist dist/
COPY --from=builder /build/package*.json ./

# Copy Prisma schema and generate client
COPY src/prisma/schema.prisma src/prisma/
RUN npx prisma generate --schema=src/prisma/schema.prisma

RUN chown -R app:app /app

USER app
EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000 \
    OTEL_SERVICE_NAME=backend-template

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
