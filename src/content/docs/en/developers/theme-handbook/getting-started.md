---
title: Build your first theme
description: Create a theme with the Z-CMS Theme SDK.
sidebar:
  order: 1
---

A theme controls how `site-runtime` renders a website. Themes depend only on `@zcmsorg/theme-sdk` and do not access the API or database directly.

## Before you start

Install Node.js 22+, pnpm 10+, and the `zcms` CLI:

```bash
npm install -g @zcmsorg/cli@latest
```

## Step 1: Scaffold the project

```bash
zcms init ./corporate --kind theme --id com.acme.theme.corporate
```

Use a reverse-DNS id under a domain you control. `init` asks for anything you leave out, and refuses to write into a directory that already holds something.

You get a theme that builds, typechecks, packs and signs with nothing changed:

```text
corporate/
├── theme.json           # the manifest
├── package.json
├── build.mjs            # esbuild -> dist/index.mjs + dist/theme.css
├── tsconfig.json
├── src/
│   ├── index.tsx        # Layout, templates, blocks, SEO
│   ├── theme.css
│   └── locales/en.json
└── .gitignore           # ignores *.pem — your signing key lives here later
```

```bash
cd corporate
pnpm install
pnpm build
```

:::caution[The entry is `.mjs`, and React is external]
`site-runtime` imports your theme by `file://` URL, so the entry is a native ES module — and it must be **`dist/index.mjs`**. A `dist/index.js` takes its module format from the nearest `package.json` `"type"`, and `package.json` ships inside the package; when the runtime guesses wrong it throws "Cannot use import statement outside a module", catches it, and **silently falls back to the default theme**. You will not see an error, only the wrong theme.

`react` and `react/jsx-runtime` must stay **external**, so your components render on the host's React instance. A second copy of React in one render produces "invalid hook call" in production and nowhere else.

`build.mjs` already gets both right. Read its comments before you change it.
:::

The rest of this page explains what the generated files contain, so you can change them with confidence.

## Step 2: Declare theme capabilities

Create `theme.json` at the package root. The required fields are `id`, `name`, `version`, `author`, `engine`, `templates`, `menuLocations` and `settingsSchema`. For a theme `entry` must be `dist/index.mjs` — see the warning above — and `styles` points at the stylesheet the theme ships.

```json
{
  "id": "com.example.theme.corporate",
  "name": "Corporate",
  "version": "0.1.0",
  "description": "Responsive corporate theme.",
  "changelog": "- First public release.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.mjs",
  "styles": "dist/theme.css",
  "templates": ["home", "page", "post", "archive", "notFound", "error"],
  "menuLocations": [
    { "key": "primary", "name": "Primary menu" },
    { "key": "footer", "name": "Footer menu" }
  ],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "primaryColor": {
        "type": "string",
        "title": "Primary colour",
        "format": "color",
        "default": ""
      }
    }
  },
  "media": {
    "screenshots": ["screenshots/home.png"]
  }
}
```

Optional fields include `changelog`, `seo`, `media`, `demo` and `optionalCapabilities`. Keep template names, menu keys and setting keys stable across updates because sites can continue referencing them.

The optional `changelog` field holds this version's release notes — a short list of what changed since the previous version. Administrators see it as a "What's new" note in the theme manager, so they know what an update brings before applying it. Write plain text with one change per line (blank lines and tabs are allowed); the limit is 2000 characters. Each published version keeps its own notes, so update `changelog` every time you bump `version`.

## Step 3: Build templates and blocks

Implement the home, page, post, archive, error, and fallback templates with `@zcmsorg/theme-sdk` types. A theme does not fetch Pages or Blogs itself: `site-runtime` passes a matched item as `content`, a listing as `archive`, and shared site data through `ctx`.

Start with [Render pages and blog posts](/en/developers/theme-handbook/rendering-content/) for working examples of `content.data`, `content.blocks`, pagination, menus, and localized URLs. If the theme ships sample data, follow [Provide demo content](/en/developers/theme-handbook/demo-content/). If it supports optional plugin features, continue with [Integrate a theme with plugins](/en/developers/theme-handbook/plugin-integration/).

1. Render only data supplied by `site-runtime`.
2. Escape untrusted content according to its field type.
3. Provide an accessible heading structure, keyboard navigation and visible focus states.
4. Define responsive behavior for narrow and wide viewports.
5. Provide a safe fallback when optional content, media or menu data is missing.

## Step 4: Define settings

Define theme settings with JSON Schema. Admin generates the settings form from this schema, so a theme can add configuration without changing `admin-web`.

Keep settings backward compatible. Add defaults for new fields, do not silently change the meaning of an existing field, and document any required migration.

## Step 5: Add assets and translations

- Include only assets used by the theme.
- Optimize images and fonts before packaging.
- Use translation keys instead of hard-coded UI text.
- Provide a default message for every key.
- Keep user content separate from theme translation messages.

## Step 6: Preview locally

Build the theme and load the local development build on a test site. Preview at least:

1. Home, listing, detail and 404 pages.
2. Empty, minimal and long-content states.
3. Every supported locale.
4. Desktop and mobile layouts.
5. Light and dark brand assets where supported.
6. Metadata, Open Graph, robots policy and JSON-LD output.

Switch away from the theme and back again to confirm that activation does not delete content or settings.

## Step 7: Test and package

Run typecheck, lint, unit tests, accessibility checks and visual regression tests. Then:

1. Update the `changelog` note in the manifest. Leave `version` alone — `zcms pack` (step 4) stamps it and advances the manifest for you; pass `--set-version` if you need a specific one.
2. Build from a clean checkout with the committed lockfile.
3. Generate the publisher key pair once if needed:

   ```bash
   zcms keygen --out ./keys
   ```

4. Copy `theme.json`, `dist` and required assets into a clean release directory, then pack it:

   ```bash
   zcms pack ./build/package --kind theme \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/corporate-0.1.0.zcms
   ```

5. Verify the publisher signature:

   ```bash
   zcms verify ./release/corporate-0.1.0.zcms
   ```

6. Record the checksum printed by `zcms pack`.

Marketplace runs the static scanner after upload and adds its co-signature during intake. Continue with [Publish a package](/en/marketplace/publishing/).
