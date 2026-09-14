# ------------ Build Stage ----------------
FROM node:22-alpine AS builder

WORKDIR /app

# copy npm configs
COPY package*.json tsconfig.json ./

# install dependencies
RUN npm ci

# copy source codes
COPY src ./src

# build tsc
RUN npm run build

# ------------ Runtime Stage ----------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# copy the compiled JS code from build stage
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]