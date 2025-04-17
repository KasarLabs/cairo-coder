FROM node:23.7-bullseye-slim

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./

# Copy backend & agents packages
COPY packages/backend ./packages/backend
COPY packages/agents ./packages/agents

# Copy shared TypeScript config
COPY packages/typescript-config ./packages/typescript-config

RUN mkdir /app/data

RUN npm install -g pnpm@9.10.0
RUN pnpm install --frozen-lockfile
RUN npm install -g turbo

CMD ["turbo", "start"]
