FROM node:23.7-alpine

ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_HOSTED_MODE
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_HOSTED_MODE=${NEXT_PUBLIC_HOSTED_MODE}
ENV NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./

# Copy UI package
COPY packages/ui ./packages/ui

# Copy shared TypeScript config
COPY packages/typescript-config ./packages/typescript-config

RUN npm install -g pnpm@9.10.0
RUN pnpm install --frozen-lockfile
RUN echo "Node version: $(node -v)"
RUN echo "npm version: $(npm -v)"
RUN echo "pnpm version: $(pnpm -v)"

# Build the UI package using Turbo
RUN pnpm turbo run build --filter=@starknet-agent/ui

WORKDIR /app/packages/ui
CMD ["pnpm", "start"]
