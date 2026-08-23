# Dockerfile de producción para apps/api (NestJS + Prisma).
# Se construye desde la RAÍZ del monorepo:
#   docker build -f apps/api/Dockerfile -t picacho-api .

FROM node:24-alpine AS base
RUN corepack enable

# ---- deps: instala todo el workspace (necesario para resolver @picacho/shared) ----
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter=@picacho/shared --filter=api

# ---- build: compila packages/shared, genera Prisma Client y compila la API ----
FROM base AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter=@picacho/shared build
RUN pnpm --filter=api exec prisma generate
RUN pnpm --filter=api build

# ---- runtime: solo lo necesario para correr ----
FROM base AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json apps/api/package.json

WORKDIR /repo/apps/api
EXPOSE 3001
# Aplica migraciones pendientes y luego arranca. Requiere DATABASE_URL en runtime.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
