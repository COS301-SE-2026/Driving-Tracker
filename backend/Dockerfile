# Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Prisma v7 loads DATABASE_URL from prisma.config.ts at generate time.
# During Docker builds we don't copy .env (ignored by .dockerignore), so provide a safe default.
ARG DATABASE_URL=postgresql://user:pass@localhost:5432/db?schema=public
ENV DATABASE_URL=$DATABASE_URL

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy dependency files first - yarn install only re-runs when package.json changes
COPY package.json yarn.lock .yarnrc.yml ./
RUN YARN_ENABLE_SCRIPTS=false yarn install --immutable
#immutable better for reproducible builds because 
#yarn is then not allowed to update yarn.lock to make the system "work"

COPY . .
# Generate prisma client during build so types are available to TypeScript
RUN yarn prisma:generate

# Build TypeScript after prisma client is generated
RUN yarn build



# Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

#remove deps then install immutably like builder
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable --mode=skip-build

# runtime artifacts only
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

#Prisma generated client
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma



USER node
EXPOSE 3000
CMD ["yarn", "start"]