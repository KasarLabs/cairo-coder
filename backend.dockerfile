FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

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

RUN pnpm install --frozen-lockfile
RUN pnpm install -g turbo

CMD ["turbo", "start"]
