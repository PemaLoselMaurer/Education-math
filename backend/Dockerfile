# Backend Dockerfile (NestJS)
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install dependencies separately for better layer caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build (tsc)
RUN npm run build

EXPOSE 3001
ENV NODE_ENV=production
# Use production start (no file watcher). For dev replace with: CMD ["npm","run","start:dev"]
CMD ["npm","run","start:prod"]
