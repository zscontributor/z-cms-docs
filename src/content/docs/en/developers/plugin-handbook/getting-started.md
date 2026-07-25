---
title: Build your first plugin
description: Learn the basic structure and lifecycle of a Z-CMS plugin.
sidebar:
  order: 1
---

Plugins run in a V8 isolate and can only access capabilities declared by the package, approved by an administrator and enforced by the CMS gateway.

## Before you start

Install Node.js 22+, pnpm 10+, and the `zcms` CLI:

```bash
npm install -g @zcmsorg/cli
```

## Step 1: Scaffold the project

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
```

Use a reverse-DNS id under a domain you control. `init` asks for anything you leave out, and refuses to write into a directory that already holds something.

You get a project that builds, typechecks, tests, packs and signs with nothing changed:

```text
hello/
├── plugin.json          # the manifest
├── package.json
├── build.mjs            # esbuild -> ONE CommonJS file
├── tsconfig.json
├── src/index.ts
├── test/plugin.test.ts
└── .gitignore           # ignores *.pem — your signing key lives here later
```

```bash
cd hello
pnpm install
pnpm build
pnpm test
```

:::caution[Build to one CommonJS file]
The sandbox is a V8 isolate. It evaluates a **single CommonJS script** and gives it exactly one module — `@zcmsorg/plugin-sdk`. There is no module resolver in there, so a plugin compiled across two source files emits a relative `require()` that the sandbox refuses — at *activation* time, on somebody's live site, long after your tests passed.

`build.mjs` bundles, which is what makes this safe: split your source across as many files as you like, and keep `format: "cjs"` and the SDK external.
:::

The rest of this page explains what the generated files contain, so you can change them with confidence.

## Step 2: Complete the manifest

Create `plugin.json` at the package root. The required fields are `id`, `name`, `version`, `author` and `engine`. `entry` defaults to `dist/index.js`; `permissions` declares the scopes requested at activation time.

```json
{
  "id": "com.example.plugin.hello",
  "name": "Hello Plugin",
  "version": "0.1.0",
  "description": "Adds a read-only content helper.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.js",
  "scope": "site",
  "permissions": ["content:read"],
  "capabilities": ["hello.content-helper"],
  "media": {
    "screenshots": ["screenshots/admin.png"]
  }
}
```

Optional plugin fields include `scope`, `capabilities`, `media`, `settingsSchema` and `database.tables`. Prefer `ctx.storage`; declare relational tables only when necessary, and keep every table inside the plugin-specific prefix enforced by the platform.

`scope` declares the plugin's **activation reach** and is either `"site"` (the default) or `"org"`:

- `"site"` — installed and activated per website. This is the default and fits most plugins (SEO, commerce, an AI assistant, and so on).
- `"org"` — installed **once for the whole organization (tenant)** and runs on **every website** that organization owns, like a WordPress "network-activated" plugin. Administrators manage it from a separate **Organization plugins** screen.

`scope` is *reach*, not *authority*: an `"org"` plugin still has its permissions approved at the tier it installs at, and never becomes a core plugin. The platform reads `scope` from the **signed** manifest, so a package cannot widen its own privileges through this field. See [Themes and plugins](/en/users/extensions/) for how administrators enable plugins at each tier.

## Step 3: Implement the entrypoint

Implement the generated entrypoint with `@zcmsorg/plugin-sdk` types and APIs.

- Use only APIs exposed by the SDK.
- Obtain content, media and mail access through the provided gateway.
- Handle the case where an optional permission was not approved.
- Keep secrets in the platform secret store; never bundle them in the package.
- Do not import database packages, filesystem APIs or Node.js built-in modules outside the runtime contract.

## Step 4: Run locally

Build the plugin and start the Z-CMS development environment. Install the local development build on a test site, then activate it for that site only.

Check the following before continuing:

1. The plugin loads without runtime or schema errors.
2. Each feature works with the minimum documented permissions.
3. The plugin fails safely when a permission is denied.
4. Deactivation stops hooks and background work cleanly.
5. Reactivation does not duplicate jobs, webhooks or stored configuration.

## Step 5: Test trust boundaries

Add automated tests for the plugin lifecycle, permission checks and invalid input. Include negative tests that try to access another tenant, use an unapproved permission and call APIs outside the SDK contract.

Run the project's typecheck, lint and test scripts. Fix every failure before packaging.

## Step 6: Build the release package

1. Set the final version in the manifest and `package.json`.
2. Update the changelog and permission disclosure.
3. Build from a clean checkout with the committed lockfile.
4. Generate the publisher key pair once if you do not already have one:

   ```bash
   zcms keygen --out ./keys
   ```

5. Copy `plugin.json`, `dist` and required runtime assets into a clean release directory, then pack that directory:

   ```bash
   zcms pack ./build/package --kind plugin \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/hello-plugin-0.1.0.zcms
   ```

6. Verify the publisher signature:

   ```bash
   zcms verify ./release/hello-plugin-0.1.0.zcms
   ```

7. Record the checksum printed by `zcms pack`.

`zcms pack` excludes `src`, `node_modules`, `.git`, `.env`, source maps and build-tool configuration. It sorts entries and zeroes archive timestamps so packing the same built directory produces identical bytes.

The first `zcms verify` checks the publisher signature only. Marketplace adds its own co-signature during intake; a runtime still refuses the publisher-only package.

## Step 7: Submit the package

Continue with [Publish a package](/en/marketplace/publishing/) for publisher verification, Marketplace submission, review, signing and release.
