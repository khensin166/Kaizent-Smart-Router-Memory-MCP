FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install omniroute globally
RUN npm install -g omniroute

# OmniRoute exposes API and dashboard on 20128
EXPOSE 20128

# Run OmniRoutee
CMD ["omniroute"]
