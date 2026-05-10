# Builder
FROM node:20-bookworm-slim
WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate


# Copy dependency files first - yarn install only re-runs when package.json changes
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
#immutable better for reproducible builds because 
#yarn is then not allowed to update yarn.lock to make the system "work"

COPY . .

#NEXT_PUBLIC_API_URL set at buildtime
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN yarn build


# Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare yarn@stable --activate

COPY package.json yarn.lock .yarnrc.yml ./
Run node -e "const fs=require('fs'); 
            const p=require('./package.json'); 
            delete p.devDependencies;
            fs.writeFileSync('./package.json', JSON.stringify(p, null, 2));"\
            && yarn install --immutable

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

USER node
EXPOSE 3001
CMD ["yarn", "start"]