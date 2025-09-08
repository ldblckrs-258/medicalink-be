# Use Node.js LTS Alpine for smaller footprint
FROM node:18-alpine

# Set memory limits for Node.js
ENV NODE_OPTIONS="--max-old-space-size=256"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build:prod

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "--max-old-space-size=256", "dist/main"]