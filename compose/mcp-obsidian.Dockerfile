FROM node:20-alpine
WORKDIR /app
COPY src/mcp/obsidian/package.json src/mcp/obsidian/package-lock.json* ./
RUN npm install
COPY src/mcp/obsidian/tsconfig.json ./
COPY src/mcp/obsidian/src ./src
RUN npm run build
CMD ["npm", "start"]
