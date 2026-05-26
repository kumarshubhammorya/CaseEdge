# Stage 1: Build the Vite React frontend
FROM node:22-slim AS builder

WORKDIR /app

# Copy package configurations and install all dependencies (including devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the production React assets
RUN npm run build

# Stage 2: Create the runtime environment
FROM node:22-slim

WORKDIR /app

# Copy package configurations
COPY package.json package-lock.json ./

# Install only production dependencies, and then add tsx to run the TS server
RUN npm ci --omit=dev && npm install tsx

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy backend source files needed by the server
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/types.ts ./src/types.ts

# Expose port 3000 (which is mapped to the backend server)
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# The service.yaml specifies '/bin/sh -c "if [ -f server.js ]; then node server.js; else npm start; fi"'
# which will run 'npm start' since server.js is not present. This executes 'tsx server.ts'.
CMD ["npm", "start"]
