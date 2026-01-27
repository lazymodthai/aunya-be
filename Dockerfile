# Base image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Enable Corepack to use the yarn version from package.json
RUN corepack enable

# Copy package files
COPY package*.json ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
COPY yarn.lock ./

# Disable global cache for Docker build
ENV YARN_ENABLE_GLOBAL_CACHE=false

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the application
RUN yarn run build

# Verify the build output exists
RUN ls -la dist/ && test -f dist/main.js

# Expose port (default 3200, can be overridden)
EXPOSE 3200

# Start the server
CMD ["node", "dist/main"]