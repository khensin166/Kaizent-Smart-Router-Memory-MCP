FROM node:20-alpine

# better-sqlite3 requires native build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY src/memory/package.json src/memory/package-lock.json* ./
RUN npm install

COPY src/memory/tsconfig.json ./
COPY src/memory/src ./src

RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
