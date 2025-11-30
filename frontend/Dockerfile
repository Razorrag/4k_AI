FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (from root context)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source files
COPY index.html ./
COPY index.tsx ./
COPY App.tsx ./
COPY types.ts ./
COPY vite.config.ts ./
COPY components/ ./components/
COPY context/ ./context/
COPY hooks/ ./hooks/
COPY services/ ./services/
COPY types/ ./types/
COPY api/ ./api/
COPY public/ ./public/

# Build production bundle
ENV VITE_APP_ENV=production
RUN npm run build

# Production image with Python (NO NGINX!)
FROM python:3.11-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Copy built files
COPY --from=builder /app/dist /app/dist

# Copy proxy server script
COPY frontend/server.py /app/server.py

# Expose custom port
EXPOSE 47823

# Run Python static server with API proxy
CMD ["python", "server.py"]
