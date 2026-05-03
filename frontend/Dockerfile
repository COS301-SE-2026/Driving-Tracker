FROM node:20-bookworm-slim

RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /app

# Copy dependency files first - yarn install only re-runs when package.json changes
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile
#frozen lockfile better for reproducible builds because 
#yarn is then not allowed to update yarn.lock to make the system "work"

COPY . .

EXPOSE 3001

CMD ["yarn", "dev"]