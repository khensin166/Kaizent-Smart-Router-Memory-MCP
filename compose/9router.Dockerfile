FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install 9router globally
RUN npm install -g 9router

# 9Router exposes API and dashboard on 20128
EXPOSE 20128

# Run 9Router
CMD ["9router"]
