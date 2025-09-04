# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies (include dev deps for building)
RUN npm install

# Copy source code
COPY . .

# Build the project (compiles TypeScript to dist/)
RUN npm run build


# ========================
# Stage 2: Production
# ========================
FROM node:20-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

WORKDIR /app

# Copy only package files for installing prod deps
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled output & other necessary files
COPY --from=builder /app/dist ./dist

# (Optional) copy other needed files, e.g. config, public assets
# COPY --from=builder /app/public ./public

# Expose the port your NestJS app runs on
EXPOSE 3000

# Run the application
CMD ["node", "dist/main"]
