FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY src/mcp/sqlite/package.json src/mcp/sqlite/package-lock.json* ./
RUN npm install
COPY src/mcp/sqlite/tsconfig.json ./
COPY src/mcp/sqlite/src ./src
RUN npm run build
CMD ["npm", "start"]
