FROM node:20-alpine

WORKDIR /app

# Install dependencies first (caching)
COPY src/router/package.json src/router/package-lock.json* ./
RUN npm install

# Copy source code
COPY src/router/tsconfig.json ./
COPY src/router/src ./src

# Build
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
