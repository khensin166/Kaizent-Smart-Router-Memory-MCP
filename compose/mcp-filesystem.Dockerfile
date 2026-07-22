FROM node:20-alpine
WORKDIR /app
COPY src/mcp/filesystem/package.json src/mcp/filesystem/package-lock.json* ./
RUN npm install
COPY src/mcp/filesystem/tsconfig.json ./
COPY src/mcp/filesystem/src ./src
RUN npm run build
# Using stdio transport, so no ports exposed, executed via docker exec or similar.
# Wait, for Docker Compose, stdio servers usually run standalone and accept stdio from a client process. 
# Alternatively, Kaizent router will spawn them as local child processes instead of Docker containers.
# Let's use command to keep container alive if needed, or simply run it as node dist/index.js.
CMD ["npm", "start"]
