# Azure App Service — Docker Compose or single container
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini openssl ca-certificates && \
    addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app

COPY dist/ dist/
COPY node_modules/ node_modules/
COPY package*.json ./
COPY src/prisma/schema.prisma src/prisma/
RUN npx prisma generate --schema=src/prisma/schema.prisma

USER app
EXPOSE 3000

ENV NODE_ENV=production PORT=3000 \
    WEBSITES_PORT=3000 \
    WEBSITE_RUN_FROM_PACKAGE=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
