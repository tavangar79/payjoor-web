# Public website image (PRD §7, §11): server.js renders the built app; it asks the backend at API_URL only
# for data-deletion statuses. Build context is the repo root, so the root package-lock.json and the npm
# workspaces resolve: `docker build -f web/Dockerfile .`

FROM node:22-alpine AS build
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
COPY admin/package.json admin/
COPY web/package.json web/
COPY backend/package.json backend/
RUN npm ci -w web --include-workspace-root=false
COPY web/ web/
RUN npm run build -w web

FROM node:22-alpine AS deps
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
COPY admin/package.json admin/
COPY web/package.json web/
COPY backend/package.json backend/
RUN npm ci --omit=dev -w web --include-workspace-root=false

FROM node:22-alpine
ENV NODE_ENV=production PORT=3001
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY web/package.json web/server.js web/
COPY --from=build /app/web/dist web/dist
WORKDIR /app/web
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz >/dev/null || exit 1
CMD ["node", "server.js"]
