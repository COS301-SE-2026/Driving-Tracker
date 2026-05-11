# Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate

# Copy dependency files first - yarn install only re-runs when package.json changes
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
#immutable better for reproducible builds because 
#yarn is then not allowed to update yarn.lock to make the system "work"

COPY . .
RUN yarn build

#Generate prisma client during build
RUN yarn prisma:generate



# Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare yarn@stable --activate

#remove deps then install immutably like builder
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn workspaces focus --all --production

# runtime artifacts only
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

#Prisma generated client
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma



USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
