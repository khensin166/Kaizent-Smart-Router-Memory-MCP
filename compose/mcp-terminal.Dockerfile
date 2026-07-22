FROM node:20-alpine
WORKDIR /app
COPY src/mcp/terminal/package.json src/mcp/terminal/package-lock.json* ./
RUN npm install
COPY src/mcp/terminal/tsconfig.json ./
COPY src/mcp/terminal/src ./src
RUN npm run build
CMD ["npm", "start"]
