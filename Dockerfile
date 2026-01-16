# syntax=docker/dockerfile:1

# ===============================
# Stage 1: Dependencies
# ===============================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# ===============================
# Stage 2: Builder
# ===============================
FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments for Convex
ARG CONVEX_DEPLOYMENT=prod:neat-poodle-687
ENV CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Convex types before building
RUN npx convex codegen

# Build the application
RUN npm run build

# ===============================
# Stage 3: Runner (Production)
# ===============================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy convex files (needed for client-side)
COPY --from=builder /app/convex ./convex

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
