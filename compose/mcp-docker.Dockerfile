FROM node:20-alpine
WORKDIR /app
COPY src/mcp/docker/package.json src/mcp/docker/package-lock.json* ./
RUN npm install
COPY src/mcp/docker/tsconfig.json ./
COPY src/mcp/docker/src ./src
RUN npm run build
CMD ["npm", "start"]
