# Multi-stage Docker build for Claude Flow
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build:ts

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S claudeflow -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=claudeflow:nodejs /app/dist ./dist
COPY --from=builder --chown=claudeflow:nodejs /app/package*.json ./
COPY --from=builder --chown=claudeflow:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER claudeflow

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/cli/main.js --version || exit 1

# Set entrypoint
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/cli/main.js"] 