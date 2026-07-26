---
title: Development quick start
description: Set up a local Z-CMS development environment.
sidebar:
  order: 1
---

Z-CMS is a TypeScript monorepo built with Node.js, pnpm, Next.js, NestJS, PostgreSQL and Redis.

## Requirements

- Node.js 22+
- pnpm 10+
- Docker

## Start locally

```bash
cp .env.example .env
pnpm install
pnpm bootstrap
pnpm dev
```

Before submitting a change, run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
```

`pnpm verify` checks critical security invariants such as tenant isolation, sandbox escape resistance and package signing.

## Build an extension

You do not need this repository to build a plugin or a theme. Install the CLI and scaffold one:

```bash
npm install -g @zcmsorg/cli@latest
zcms init
```

`init` asks whether you are building a plugin or a theme, then writes a project that builds, typechecks, tests, packs and signs with nothing changed — including the two build rules that are otherwise enforced only at runtime, on a live site.

Then follow the workflow that matches what you are building:

- [Create a plugin](/en/developers/plugin-handbook/getting-started/)
- [Create a theme](/en/developers/theme-handbook/getting-started/)
- [Scaffold, pack and verify with `zcms`](/en/developers/cli/)
- [Submit the package for Marketplace review](/en/marketplace/publishing/)
