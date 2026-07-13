FROM node:22-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (dev + prod) for building
RUN npm ci

# Copy the rest of the application
COPY . .

# Build Next.js application
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --omit=dev

# Create persistent directories for file uploads and database
RUN mkdir -p /app/public/documents /app/database

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
