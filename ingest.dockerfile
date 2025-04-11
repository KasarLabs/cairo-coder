FROM node:18

WORKDIR /app

# Copy package.json and package-lock.json (if you have one)
COPY package.json package-lock.json* ./

# Copy the rest of your application code
COPY . .

# Install dependencies
RUN yarn install
# Compile TypeScript to JavaScript
RUN yarn build

# Set the command to run your script
CMD ["node", "dist/scripts/generateEmbeddings.js"]
