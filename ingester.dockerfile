FROM node:20

WORKDIR /app

# Copy root workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./

# Copy backend & agents packages
COPY packages/backend ./packages/backend
COPY packages/ingester ./packages/ingester
COPY packages/agents ./packages/agents

# Copy shared TypeScript config
COPY packages/typescript-config ./packages/typescript-config

RUN npm install -g pnpm@9.10.0
RUN pnpm install --frozen-lockfile
RUN npm install -g turbo

# Install Antora
RUN npm install -g @antora/cli @antora/site-generator

# Install mdbook
RUN curl -L https://github.com/rust-lang/mdBook/releases/download/v0.4.36/mdbook-v0.4.36-x86_64-unknown-linux-gnu.tar.gz | tar xz && \
    mv mdbook /usr/local/bin/

# Set the command to run your script
# Ensure this path is correct relative to the WORKDIR after build
CMD ["turbo", "run", "generate-embeddings:yes"]