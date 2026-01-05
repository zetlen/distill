# Build stage - includes build tools for native compilation
FROM node:25-alpine3.22 AS builder

# Install build dependencies (python3, make, g++ for node-gyp)
RUN apk add --no-cache python3 build-base

WORKDIR /build

COPY package*.json ./

# Install production dependencies (includes native compilation)
RUN npm ci --omit=dev

COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage - minimal image with only runtime dependencies
FROM node:25-alpine3.22

# Install only runtime CLI tools
RUN apk add --no-cache git yq-go jq ast-grep

WORKDIR /app

# Copy built artifacts and node_modules from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/bin ./bin
COPY --from=builder /build/package.json ./

ENTRYPOINT ["./bin/run.js"]

CMD ["--help"]
