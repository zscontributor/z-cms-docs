---
title: Appearance and theme settings
description: Install, activate, and configure a theme for the current site.
sidebar:
  order: 7
---

A theme controls the public site's templates, blocks, menu locations, assets, and SEO metadata. Themes are installed on the system and activated and configured for the current site.

## Before changing themes

1. Verify the current site in the site switcher.
2. Read the theme description, version, and compatibility information.
3. Confirm that it provides templates for the content types you use.
4. Save a record of the current theme settings so that you can restore them if the new theme causes problems. If the site is already public, test the new theme on a staging site before applying it to the live site.

## Install and activate

Open **Appearance** to see installed themes and themes available from the catalog. `theme:install` permits package installation, while `theme:activate` permits switching the active theme. Activation invalidates the site's render cache but does not delete content.

Each theme card shows a **What's new** note when its author shipped one — the release notes for the installed version. Expand it to see what a version changed before you switch to it or update.

## Configure a theme

For the active theme, Z-CMS generates a settings form from its JSON Schema. Depending on the theme, this can include colors, typography, a theme-specific logo, social links, layouts, icons, and SEO options.

- Leave logo or color overrides empty to inherit the site's shared brand.
- Select assets from the Media Library instead of using temporary URLs.
- After saving, inspect the public site on desktop and mobile, including detail and not-found pages.

Some themes provide **Seed demo content**. Use it only on a new site or staging environment because it may create content types, pages, posts, menus, and theme settings.

## Theme-owned SEO

A theme can generate title templates, icons, robots policies, Open Graph metadata, and JSON-LD from its settings and the site brand. After switching themes, inspect the page source and a social-sharing preview tool.

:::note
If installation, activation, or configuration controls are disabled, your account may have read-only access or you may have selected the wrong site.
:::
