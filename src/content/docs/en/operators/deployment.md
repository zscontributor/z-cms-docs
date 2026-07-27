---
title: Production deployment
description: Deploy Z-CMS from the official Docker images, plus the components and safeguards required to operate it.
sidebar:
  order: 1
---

You do **not** need to build Z-CMS from source to run it. Official, multi-arch
images (`linux/amd64` + `linux/arm64`) are published on Docker Hub under
[`zcms`](https://hub.docker.com/u/zcms) and updated on every release.

## Deploy with the official images (recommended)

The [**z-cms-docker-offical-image**](https://github.com/zscontributor/z-cms-docker-offical-image)
repository is the fastest path to a running instance. It provides a complete
`docker compose` stack that pulls the official images, ready-made reverse-proxy
setups (Traefik, Caddy, Nginx, Apache and Portainer), a `.env` documenting every
setting, and helper scripts for secrets and the first-run seed.

```bash
git clone https://github.com/zscontributor/z-cms-docker-offical-image.git zcms
cd zcms

# 1. Create .env with strong random secrets
cp .env.example .env
./scripts/generate-secrets.sh --write

# 2. Start the stack (pulls zcms/* from Docker Hub)
docker compose up -d

# 3. Create the first admin user + demo site (run once)
./scripts/first-run-seed.sh
```

For a public domain with automatic HTTPS, layer a reverse-proxy overlay — for
example Traefik:

```bash
docker compose -f docker-compose.yml -f compose/traefik.yml up -d
./scripts/first-run-seed.sh -f docker-compose.yml -f compose/traefik.yml
```

Each proxy routes `/api` → the API, `/admin` → the admin UI, `/zcms-media` →
media, and everything else → the public site. Full configuration, upgrade,
backup and production-hardening guides live in that repository.

:::tip
Pin `ZCMS_VERSION` to an exact release tag (for example `0.1.0`) in production for
reproducible rollouts and easy rollbacks; `latest` tracks the newest release.
:::

## Published images

| Image | Role |
| --- | --- |
| `zcms/cms-api` | Core API (holds DB/S3 credentials) |
| `zcms/site-runtime` | Public site (renders theme code — hardened) |
| `zcms/admin-web` | Admin UI |
| `zcms/worker` | Background jobs |
| `zcms/plugin-runtime` | Untrusted-plugin sandbox (credential-free) |
| `zcms/migrate` | One-shot: migrations + register signed built-ins |

A complete deployment also runs PostgreSQL, Redis and S3-compatible object
storage (the compose stack bundles them, or point at managed providers).

## Checklist

- Use separate credentials for each service.
- Ensure the application database role is `NOBYPASSRLS` and owns no tables.
- Do not give database, S3 or session credentials to the plugin runtime.
- Pin `MARKETPLACE_PUBLIC_KEY` from a trusted source (the default
  `FIRST_PARTY_PUBLIC_KEY` shipped in `.env.example` already matches the official
  images).
- Enable TLS for every public hostname.
- Run migrations before routing traffic to a new version (the `migrate` job does
  this automatically on every `up`).
- Configure backups and test restoration regularly.

:::danger
Never configure `APP_DATABASE_URL` with the database owner role. A table owner can bypass Row-Level Security and break tenant isolation.
:::

## Building your own images

Only needed for a fork or a customised build. The distribution repo ships a
GitHub Actions workflow and a `scripts/build-and-push.sh` that build all six
images multi-arch from the source monorepo. A fork that changes built-in
themes/plugins must sign them with its own key and set `FIRST_PARTY_PUBLIC_KEY`
to the matching public half everywhere.
