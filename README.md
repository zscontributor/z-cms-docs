# Z-CMS Documentation

**English** | [Tiếng Việt](readme/README.vi.md) | [日本語](readme/README.ja.md)

Z-CMS is a multi-tenant CMS: **one codebase and one deployment run many independent
sites** — brands, branches or customers — each with its own domain, content, theme
and settings. There is no separate source to clone or maintain per website, so
developers ship to every site from a single codebase and businesses launch a new
branch or brand in minutes on shared infrastructure.

This repository holds the documentation for Z-CMS users, extension developers,
operators and marketplace publishers — published at **[docs.z-cms.org](https://docs.z-cms.org)**.

## Development

Requires Node.js 24+ and pnpm 10+.

```bash
pnpm install
pnpm dev
```

The local site is available at `http://localhost:4321`.

## Validation

```bash
pnpm check
pnpm build
```

## Content

Documentation lives in `src/content/docs/<locale>/` and is grouped by audience:

- `users` — site owners, editors and administrators
- `developers` — core, plugin and theme developers
- `operators` — self-hosting and production operations
- `marketplace` — publishers and package distribution
- `contributing` — documentation contribution guidelines

Vietnamese (`vi`) is the default locale. English pages use the same relative paths under `en`.

## Deployment

The production canonical URL is `https://docs.z-cms.org`. The build output is fully static in `dist/` and can be deployed to any static hosting provider.
