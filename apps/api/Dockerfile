# Build from the repo root: docker build -f apps/api/Dockerfile .
FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/floor-model/package.json packages/floor-model/
COPY packages/accessops/package.json packages/accessops/
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3.14
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=deps /app/packages/floor-model/node_modules packages/floor-model/node_modules
COPY packages/floor-model packages/floor-model
COPY packages/accessops packages/accessops
COPY --from=deps /app/packages/accessops/node_modules packages/accessops/node_modules
COPY apps/api apps/api
RUN mkdir -p /var/lib/accessops/uploads && chown -R bun:bun /var/lib/accessops
USER bun
WORKDIR /app/apps/api
# Run schema migrations before accepting requests.
CMD ["bun", "src/index.ts"]
