# AWS Elastic Beanstalk — Single-container Docker
# Build: eb init / eb create
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini openssl ca-certificates && \
    addgroup -g 1001 app && adduser -u 1001 -G app -s /bin/sh -D app

COPY --from=main --chown=app:app dist/ dist/
COPY --from=main --chown=app:app node_modules/ node_modules/
COPY --from=main --chown=app:app package*.json ./
COPY --from=main --chown=app:app src/prisma/schema.prisma src/prisma/
RUN npx prisma generate --schema=src/prisma/schema.prisma

USER app
EXPOSE 3000

ENV NODE_ENV=production PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
