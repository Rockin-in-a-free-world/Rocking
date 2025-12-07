# Dockerfile for Railway deployment with native module support
# Using standard Node.js image (not Alpine) for better native module compatibility
FROM node:20-slim

# Install build dependencies for native modules
# sodium-native requires these for compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Explicitly rebuild sodium-native for this environment
RUN npm rebuild sodium-native || (echo "Warning: sodium-native rebuild failed" && npm list sodium-native)

# Copy application code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

