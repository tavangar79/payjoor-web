# Public website build (PRD §7, §11). Build context is the repo root, so the root package-lock.json and the
# npm workspaces resolve: `docker build -f web/Dockerfile .` (docker-compose.yml does this).
# The result is an artifact image holding dist/client and dist/server at /dist; the backend image copies
# them and server-renders the site, so this image is never run.

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

FROM scratch
COPY --from=build /app/web/dist /dist
