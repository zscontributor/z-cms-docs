---
title: Publish a package
description: Prepare and submit a plugin or theme to the Marketplace.
sidebar:
  order: 2
---

This workflow starts after the plugin or theme has passed its local tests. Submit the same artifact that you verified locally; do not rebuild it during review.

## Step 1: Generate and register a publisher key

Generate an Ed25519 key pair once for the publisher:

```bash
zcms keygen --out ./keys
```

This creates `publisher-private.pem` with mode `0600` and `publisher-public.pem`. Back up the private key securely; never commit, upload or paste it into a web form.

Open **Developer Portal → Publisher** and register:

1. A slug of 3–40 lowercase letters, digits or hyphens, without a leading or trailing hyphen.
2. The display name.
3. An optional contact email.
4. The complete contents of `publisher-public.pem`.

The public key may belong to only one publisher. If a private key is ever pasted or exposed, treat it as compromised and generate a new pair.

## Step 2: Prepare the listing

The public listing is built from the signed manifest. Complete the following before packing:

1. Reverse-DNS `id`, display `name`, semantic `version`, `description` and `author`.
2. Compatible Z-CMS range in `engine`.
3. Built `entry`, normally `dist/index.js`.
4. Plugin `permissions`, capabilities and settings, or theme templates and settings.
5. Up to three screenshots in `media.screenshots`; each must be PNG, JPEG or WebP, at most 2 MB and 4096 px per side.
6. An optional external HTTPS video URL in `media.video`.

An update that adds permissions or changes data processing must call out the change explicitly. Do not hide a permission increase in a general changelog entry.

## Step 3: Pack and sign one release artifact

Build from a clean checkout using the committed lockfile and the toolchain version documented by the project, then run typecheck, lint and unit tests and confirm that the built entry is correct. You do not hand-edit the version — `zcms pack` stamps and advances it for you (see **`pack` sets the version** below).

### Point `pack` at the theme or plugin you are publishing

`zcms pack` packages **exactly one directory**, and that directory is its first argument — the path to the theme or plugin you want to publish. Nothing outside that path is included, so this is where you say *which* extension you are packing. The directory must hold, at its root:

- the manifest — `theme.json` for a theme, `plugin.json` for a plugin — and
- the built entry the manifest names in `entry`: `dist/index.mjs` for a theme, `dist/index.js` for a plugin. Build before packing; `pack` does not build for you.

`--kind` must match the manifest at that path: `--kind theme` with a `theme.json`, `--kind plugin` with a `plugin.json`.

**To pack a theme**, point the path at the theme's directory:

```bash
mkdir -p release

zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/corporate-1.0.0.zcms
```

**To pack a plugin**, point the path at the plugin's directory instead:

```bash
zcms pack ./plugins/seo-toolkit --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/seo-toolkit-1.0.0.zcms
```

The path may be absolute (`/home/me/themes/corporate`) or relative (`./themes/corporate`, or `.` when your shell is already inside the directory) — it just has to resolve to the directory that holds the manifest. Pass one path per command: to publish several extensions, run `zcms pack` once for each. If `--out` is omitted, the file is written to the current directory as `<manifest.id>-<manifest.version>.zcms`.

### `pack` sets the version

You do not edit the version by hand before publishing. `zcms pack` ships the version the manifest currently declares, then advances it — patch by default — and writes the new number back to the manifest and to `package.json`, so the next release is already a new version. Pass `--bump minor|major` for a larger step, `--set-version <semver>` to pin an exact one, or `--no-bump` to hold it. The `<manifest.id>-<manifest.version>.zcms` filename uses the version that was shipped; if a pack fails, the version is rolled back.

### Signing happens inside `pack`

Packing **is** the signing step — there is no separate `zcms sign` command. `--key` is your publisher **private** key, and `zcms pack` signs the package's payload checksum with it as it writes the file; `--pub` embeds the matching **public** key so a verifier can check that signature. Both come from Step 1. Keep the private key off shared machines and out of CI logs; the packer never ships `*.pem` files inside the archive, but it cannot protect a key you paste somewhere.

The command prints the package id, version, file size and checksum. Record the checksum — it is what both the verifier and Marketplace re-compute.

### Verify, then check reproducibility

Verify the publisher signature on the exact file you will submit:

```bash
zcms verify ./release/corporate-1.0.0.zcms
```

Then pack the same directory a second time to confirm the build is reproducible. Because `pack` advances the version on each run, add `--no-bump` to both packs so the version is held fixed across them; the CLI sorts files and zeroes archive timestamps, so the checksum should match the first run. If the two checksums differ, find and remove nondeterministic inputs such as timestamps, unordered file lists or unpinned dependencies before submitting.

## Step 4: Submit for review

Submit the **exact `.zcms` file you verified** in Step 3 — do not rebuild or repack it between verifying and uploading.

Open **Developer Portal → Submit a package**, choose the `.zcms` file and select **Submit for review**. The upload limit is 20 MB, and each developer account may submit at most 10 packages in a sliding hour.

The portal does not ask you to select a publisher, package id or version. It reads these values from the signed envelope and resolves the publisher from the registered public key — so the identity of what you are submitting comes entirely from the package you signed, not from a form.

For API upload, send an authenticated `multipart/form-data` request to `POST /developer/submissions` with the file in the `file` field. Use `GET /developer/submissions` to list your submissions and track their status.

After submitting, the version moves through the states described in the next steps: automated intake first (Step 5), then a human decision (Step 6). Watch its status in **Developer Portal → Submissions**; a rejection always comes with a reason you can act on.

## Step 5: Automated validation

Marketplace performs intake in this order:

1. Open the archive without executing it and recompute the payload checksum.
2. Resolve the registered publisher from the public key and verify that the signed-in developer owns it.
3. Verify the publisher signature against the registered key, not a key supplied only by the package.
4. Validate media and run the static scanner.
5. Add the Marketplace co-signature and store the accepted artifact.

A scanner `reject` returns an error and creates no version. A scanner `flag` creates a `QUARANTINED` version with findings attached. A clean scan creates a `PENDING` version; it is not an approval.

## Step 6: Manual review

Every third-party `PENDING` or `QUARANTINED` version requires a human decision. The persisted states are `PENDING`, `QUARANTINED`, `APPROVED` and `REJECTED`. The Developer Portal and notifications show the result; a rejection includes a reason.

When changes are requested:

1. Read the rejection note and scanner findings.
2. Update source, tests and manifest.
3. Build, sign and verify a new `.zcms` artifact — `zcms pack` stamps the next version automatically (the manifest already advanced after your previous pack).
4. Submit the new version.

Versions are immutable. Re-uploading different bytes under an existing version is refused; re-uploading identical bytes keeps the existing verdict.

## Step 7: Marketplace signing

`zcms pack` creates the publisher signature. During intake—after publisher verification and scanning—Marketplace adds a second signature over the same checksum and stores the co-signed `.zcms` file.

The Marketplace co-signature does not make a pending package public. Only an `APPROVED` and non-revoked version is served by the registry. Z-CMS runtimes verify the co-signature with their pinned `MARKETPLACE_PUBLIC_KEY` before installation.

## Step 8: Publish and verify

Approval makes the version available in the public registry. After approval:

1. Open the public listing and verify metadata, screenshots and changelog.
2. Install the package on a clean test site from Marketplace.
3. Confirm that signature verification succeeds.
4. Activate the package with only its documented permissions.
5. Run a short smoke test and verify uninstall or rollback behavior.

To verify a package downloaded from Marketplace outside the runtime, use the trusted Marketplace public key:

```bash
zcms verify ./downloaded-package.zcms --marketplace-key ./marketplace-public.pem
```

## Step 9: Maintain the release

Monitor the support channel and security contact. Publish fixes as new semantic versions; do not mutate an existing release.

For a security issue, coordinate disclosure, submit the fixed package and request revocation of affected versions when necessary. Runtimes synchronize the signed revocation feed and quarantine revoked packages.

:::note[Theme demo content is not updated automatically]
If your theme ships demo content, updating the theme does **not** refresh a site's demo data. When a new version changes that demo data — corrected translations, added pages or menus — each site keeps its existing demo content until its administrator opens **Admin → Appearance** and clicks **Reseed demo** for the active theme (a fresh install needs **Seed demo** first). Reseeding replaces only that theme's demo rows and leaves the admin's real content untouched. Say so in the changelog so operators know to reseed. See [Provide demo content](/en/developers/theme-handbook/demo-content/#understand-reseeding).
:::
