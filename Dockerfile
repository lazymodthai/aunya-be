# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Enable Corepack to use the yarn version from package.json
RUN corepack enable

# Copy package files
COPY package*.json ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
# Corepack will now automatically use the correct yarn version (4.8.1)
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 3005

# Start the server
CMD ["node", "dist/main"]