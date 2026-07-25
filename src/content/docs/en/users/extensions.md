---
title: Themes and plugins
description: Install and manage extensions from Z-CMS Marketplace.
sidebar:
  order: 6
---

Z-CMS installs themes and plugins as signed packages. A package signature is checked before its contents are imported.

## Before installing a plugin

Review the publisher, compatible versions, changelog, requested permissions and data policy. The changelog appears as a **What's new** note on each plugin — the release notes the publisher wrote for that version, so you can see what a new version does before approving it.

## Installation

1. Open **Marketplace** in Admin.
2. Select a plugin or theme.
3. Review permissions and compatibility.
4. Select **Install**.
5. For a plugin, approve the required permissions and activate it.

:::danger
Do not install a package received directly from an untrusted source or one without a valid signature.
:::

## Plugin lifecycle

**Install** adds a verified package to the system; **Activate** lets it run for **one website**; **Deactivate** stops its functionality without removing the package. Configuration and plugin data may remain after deactivation, so read the removal guide before uninstalling.

## Activation tiers: site and organization

Every plugin belongs to exactly one **activation tier**, which decides where it runs:

- **Core plugins** — shipped by Z-CMS, pre-installed on every website but left **off** until an administrator turns one on and approves its permissions.
- **Site plugins** — installed and activated per website on the **Plugins** screen. This is the default tier.
- **Organization plugins** — turned on **once for the whole organization** on the **Organization plugins** screen, after which they run on **every website** the organization owns. On each website's Plugins screen these appear read-only, marked "Activated organization-wide".

Only an Administrator or Owner can manage organization plugins, because a change there affects every website. A plugin can only be installed at the tier its manifest declares (`scope`): an organization plugin cannot be installed on a single site, and vice versa.

## Approve permissions

The manifest lists requested permissions, but an administrator can approve only a subset. Grant only capabilities needed by enabled features. Review `content:update`, `media:delete`, `mail:send`, and any external data transfer especially carefully.

## Updates and quarantine

Before updating, read the changelog, new permissions, and migration requirements. The runtime synchronizes a signed revocation list and quarantines revoked packages. Do not reactivate a quarantined package—upgrade to a fixed version or contact its publisher.

See [Appearance and theme settings](/en/users/appearance/) for the theme switching and verification workflow.
