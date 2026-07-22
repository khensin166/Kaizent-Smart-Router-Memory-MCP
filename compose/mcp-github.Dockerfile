FROM node:20-alpine
WORKDIR /app
COPY src/mcp/github/package.json src/mcp/github/package-lock.json* ./
RUN npm install
COPY src/mcp/github/tsconfig.json ./
COPY src/mcp/github/src ./src
RUN npm run build
CMD ["npm", "start"]
