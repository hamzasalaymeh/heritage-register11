# ── Neural Brain — single-service production image ──────────────────────
# Builds the React client, compiles the TypeScript server, and serves both
# from one Node process (Express serves client/dist as static files).

# Stage 1: build the client
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# Stage 2: build the server
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --no-audit --no-fund
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# Stage 3: runtime
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/package.json ./package.json
COPY --from=client-build /app/client/dist ./public

# Long-term memory lives here — mount a volume to persist it across deploys.
RUN mkdir -p /app/data
ENV MEMORY_FILE=/app/data/memory.json
ENV PORT=8787
EXPOSE 8787

CMD ["node", "dist/index.js"]
