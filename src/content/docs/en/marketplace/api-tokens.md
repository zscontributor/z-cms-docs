---
title: API tokens
description: Create and use a Developer Portal API token to submit packages without a browser session.
sidebar:
  order: 3
---

An **API token** is a machine credential that lets a program submit packages to the Marketplace on your behalf — without a browser login. Two things use it:

- The **Z-CMS Theme Editor**, when you sign and submit a drawn theme straight from the admin ("Connect a marketplace account").
- Your **own scripts or CI**, calling the submission API directly.

A token can do exactly one thing — submit a package for review. It cannot sign a package, create other tokens, register or rotate a publisher key, or read anything private. Its only scope is `submissions:write`. Signing still happens with your publisher key, which never leaves your machine or browser; the token only carries the already-signed package to the Marketplace.

## Create a token

Open **Developer Portal → Tokens** and create one:

1. **Label** — a name only you see, so you can tell tokens apart later: `my laptop`, `acme CI`.
2. **Expiry** — `Never`, or 30 / 90 / 365 days. A token that lives in a secret store for months should have an end date; the Portal refuses it automatically after it passes.

Press **Create**. The full token — it looks like `zcms_pat_…` — is shown **once**, right then. Copy it immediately: it is stored only as a hash and can never be retrieved again. If you lose it, revoke it and create another.

## Use a token

### From the Z-CMS admin

In the Theme Editor's **Publish** panel, open **Connect a marketplace account**, paste the token, and press **Connect**. It is stored encrypted and never shown again. From then on, **Sign & submit** uploads your signed package using it.

### From a script or CI

Send the token as a bearer credential on the submission endpoint:

```bash
curl -X POST https://marketplace.z-cms.org/api/v1/developer/submissions \
  -H "Authorization: Bearer zcms_pat_…" \
  -F "file=@corporate-1.2.0.zcms"
```

List and track your submissions the same way:

```bash
curl https://marketplace.z-cms.org/api/v1/developer/submissions \
  -H "Authorization: Bearer zcms_pat_…"
```

The upload limit is 20 MB, and each developer account may submit at most 10 packages in a sliding hour. The Portal reads the package id, version and publisher from the signed envelope — the token only proves who is uploading.

## Manage and revoke

The token list shows each token's label, its visible prefix (`zcms_pat_` plus a few characters — enough to recognise it, not to authenticate with), when it was created, when it was last used, and its expiry.

**Revoke** is the kill switch: the very next request made with a revoked token fails. Revoke a token the moment you suspect it has leaked, when a machine is decommissioned, or when a CI secret is rotated.

## Keep tokens safe

- **One token per place** — a token for your laptop, another for each CI system. Revoking one then never disturbs the others.
- **Set an expiry** for anything long-lived; renew deliberately rather than leaving a credential valid forever.
- **Never commit a token** or paste it into a public page. The `zcms_pat_` prefix is deliberate: it lets secret scanners catch a leaked token quickly — but revoking it yourself is faster.
- The token is stored **hashed**, so a database compromise on our side yields no usable credential. Treat your own copy with the same care.

## Related

- [Publish a package](/en/marketplace/publishing/) — the full keygen → pack → sign → submit workflow.
- [Marketplace overview](/en/marketplace/overview/) — how review and distribution work.
