# Base image
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Enable Corepack to use the yarn version from package.json
RUN corepack enable

# Copy package files first for better layer caching
COPY package.json yarn.lock .yarnrc.yml ./

# Copy .yarn folder if it exists (for caching)
COPY .yarn ./.yarn

# Disable global cache for Docker build
ENV YARN_ENABLE_GLOBAL_CACHE=false

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn run build

# Expose port
EXPOSE 3200

# Start the server
CMD ["node", "dist/src/main"]