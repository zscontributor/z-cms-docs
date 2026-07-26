---
title: zcms CLI reference
description: Scaffold, pack and sign Z-CMS themes and plugins.
sidebar:
  order: 4
---

`zcms` is how you start, build and sign an extension. It has four commands — `init`, `keygen`, `pack` and `verify` — plus `help`. It does not upload packages — see [Publish a package](/en/marketplace/publishing/).

## Install

```bash
npm install -g @zcmsorg/cli@latest
```

The package is `@zcmsorg/cli`; the command it installs is `zcms`. It requires Node.js 22 or newer.

It has no dependencies. The signing code is bundled into the one file, so the bytes that sign your packages are the ones the Z-CMS repository builds — not whatever the registry resolved on the day you installed it. That matters more than it usually would: this tool lives on the machine that holds the private key behind everything you publish.

## Command summary

```text
zcms init [<dir>] [--kind theme|plugin] [--id <reverse.dns.id>] [--name <name>]
          [--description <text>] [--author <name>] [--author-url <url>]
          [--version <semver>] [--yes]
zcms keygen [--out <dir>]
zcms pack <dir> --kind theme|plugin --key <private.pem> --pub <public.pem>
          [--operator-key <private.pem>] [--out <file>]
zcms verify <file.zcms> [--marketplace-key <public.pem>]
zcms help [--lang en|ja|vi]
```

Run `zcms` without a command to print this usage information.

### Help and language

`zcms help` prints the usage above; so do `zcms` with no command, `zcms -h`, `zcms -help` and `zcms --help`. The help text is available in English, Japanese and Vietnamese:

```bash
zcms help --lang vi      # Tiếng Việt
zcms help --lang ja      # 日本語  (--lang JP and --lang VN are accepted too)
```

Without `--lang`, the language is read from `ZCMS_LANG`, then from your shell locale (`LANG`), and otherwise falls back to English. Only the help text is translated — build output, checksums and error details are identical in every language.

## 1. Scaffold the project

```bash
zcms init
```

`init` asks whether you are building a plugin or a theme, then writes a project that already builds, typechecks, tests, packs, signs and passes the Marketplace scanner with nothing changed. It will not write into a directory that already holds anything.

Non-interactive, for scripts and CI:

```bash
zcms init ./hello --yes --kind plugin \
  --id com.acme.plugin.hello \
  --name "Hello" \
  --author "Acme"
```

A plugin comes out as:

```text
hello/
├── plugin.json          # the manifest — identity, permissions, settings form
├── package.json
├── build.mjs            # esbuild -> ONE CommonJS file
├── tsconfig.json
├── src/index.ts         # filters, actions, jobs, setup
├── test/plugin.test.ts
├── README.md
└── .gitignore           # ignores *.pem — see below
```

A theme is the same shape, with `theme.json`, `src/index.tsx` (Layout, templates, blocks) and `src/theme.css`.

### Why the scaffold matters

Two contracts are enforced at **runtime, on a live site**, not by your build. Guessing wrong on either produces an extension that builds, tests, packs, signs and installs — and then fails in front of a user. `init` writes a project that already satisfies both.

| | The contract | What happens when you break it |
| --- | --- | --- |
| **Plugin** | One **CommonJS** file. The sandbox is a V8 isolate that provides exactly one module, `@zcmsorg/plugin-sdk`. | There is no module resolver in there. A plugin compiled across two source files emits a relative `require()`, which the sandbox refuses — at *activation* time, on somebody's site, long after your tests passed. This is why `build.mjs` bundles: split your source across as many files as you like. |
| **Theme** | Entry is **ESM**, and the file is **`.mjs`**. React is **external**. | A `dist/index.js` takes its module format from the nearest `package.json` `"type"` — and `package.json` ships inside the package. Guess wrong and `site-runtime` throws "Cannot use import statement outside a module", catches it, and silently falls back to the default theme. Bundle a second copy of React and you get "invalid hook call" in production and nowhere else. |

### The development loop

```bash
cd hello
pnpm install
pnpm build       # plugin -> dist/index.js   theme -> dist/index.mjs + dist/theme.css
pnpm typecheck
pnpm test
```

## 2. Generate a publisher key pair

```bash
zcms keygen --out ./keys
```

The command creates:

- `publisher-private.pem`, readable only by its owner (`0600`)
- `publisher-public.pem`, which may be registered in the Developer Portal

The CLI refuses to overwrite an existing key file — private or public. Overwriting a private key orphans every package it has ever signed; rewriting only the public half would leave you with a mismatched pair. Point `--out` at an empty directory.

`publisher-private.pem` **is your identity**. Anyone who has it can sign a package as you, and once it leaks every package you ever signed has to be treated as forgeable. Back it up somewhere a repository is not. The scaffold's `.gitignore` already excludes `*.pem`, and the packer never puts key material inside a package (see below) — but neither control can help you if you paste it into a chat or a CI log.

## 3. Prepare a package directory

The manifest sits at the root of the directory you pack:

- `plugin.json` for `--kind plugin`
- `theme.json` for `--kind theme`

It must contain `id`, `name`, `version`, `author` and `engine`. `entry` points at the built file and must exist before packing — `dist/index.js` for a plugin, `dist/index.mjs` for a theme (see the table above for why the theme's extension is not optional).

A scaffolded project can be packed as it stands: `zcms pack .`. The packer keeps out of the package everything that is not part of what runs —

- **key material**: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`, `id_*`, and `.npmrc`
- **secrets and VCS**: `.env*`, `.git`, `node_modules`
- **dev-only**: `src`, `test/`, build scripts, `tsconfig*.json`, tool configs, source maps

The key-material rule is not tidiness. `keygen` writes your private key into the project directory, because that is where you run it, and `pack` is then pointed at that same directory — so without that rule the key that signs the package would ship *inside* it: uploaded to Marketplace, then unpacked onto every site that installs your extension. It is excluded silently and unconditionally.

## 4. Pack and publisher-sign the extension

For a plugin:

```bash
zcms pack . --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/example-plugin-1.0.0.zcms
```

For a theme, use the same command with `--kind theme`. If `--out` is omitted, the output filename is `<manifest.id>-<manifest.version>.zcms` in the current directory.

The command prints the package id, version, file size and checksum. This artifact has a valid publisher signature, but it is not installable until Marketplace has reviewed and co-signed it.

### Sideload signature (self-hosted only)

Marketplace publishers can skip this. If you run your **own** Z-CMS instance and want to install an extension without going through Marketplace, add `--operator-key`:

```bash
zcms pack . --kind theme \
  --key ./op-private.pem --pub ./op-public.pem \
  --operator-key ./op-private.pem
```

This stamps a second, **operator** signature. An instance whose runtimes pin the matching `OPERATOR_PUBLIC_KEY` — and, for themes, set `ALLOW_THEME_SIDELOAD=true` — will run the package once an admin uploads it under **Admin → Appearance → Install from file** and approves it, with no Marketplace involved. Use the same operator key pair for `--key`/`--pub`. A package signed this way is meant for sideloading, not for Marketplace submission.

## 5. Verify before submission

```bash
zcms verify ./release/example-plugin-1.0.0.zcms
```

Without `--marketplace-key`, `verify` checks the payload checksum and publisher signature. A failed verification exits with a non-zero status.

## 6. Verify a Marketplace package

After downloading an approved package, verify both signatures with a trusted Marketplace public key:

```bash
zcms verify ./downloaded-package.zcms \
  --marketplace-key ./marketplace-public.pem
```

Only this mode confirms that the package carries a valid Marketplace co-signature and is installable.

## 7. Upload for review

There is no `zcms publish` command. Upload the exact `.zcms` file you verified through **Developer Portal → Submit a package**, or send it as the `file` field in an authenticated `multipart/form-data` request to `POST /developer/submissions`.

See [Publish a package](/en/marketplace/publishing/) for the complete review workflow.
