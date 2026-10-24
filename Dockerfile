# syntax=docker/dockerfile:1
#
# Z-CMS docs — build the Astro/Starlight site to static HTML, then serve it from a
# tiny nginx image. The runtime carries no Node, no toolchain, just the built files.
#
#   docker build -t z-cms-docs .

FROM node:24-bookworm-slim AS build
# Non-interactive install (pnpm/CI). NODE_ENV stays unset so devDependencies
# (@astrojs/check, typescript) are installed — `astro check` needs them.
ENV CI=true
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ---------------------------------------------------------------------------
FROM nginx:1.30-alpine AS runtime
LABEL org.opencontainers.image.source="https://github.com/zscontributor/z-cms-docs"
COPY --from=build /repo/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
