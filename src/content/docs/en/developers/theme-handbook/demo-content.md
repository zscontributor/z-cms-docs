---
title: Provide demo content
description: Declare settings, content types, content, and menus that an administrator can seed from a theme.
sidebar:
  order: 4
---

A theme can provide an optional demo dataset in the `demo` field of `theme.json`. When the theme is active, an administrator with `theme:configure` permission can apply it from **Appearance → Seed demo**.

The dataset is part of `theme.json`; the current manifest contract does not load it from a separate `demo.json` file. Keeping it in the manifest also means it is included in the signed theme package.

:::caution[Demo data is for evaluation]
Test seeding and reseeding on a new site or staging environment. A seed can create content types, published content, menus, and theme settings. It must not be required for the theme to render: the theme still needs useful empty states.
:::

## Add the demo declaration

The `demo` object supports four optional sections:

| Field | Purpose |
| --- | --- |
| `settings` | Values merged into the active theme's existing settings. |
| `contentTypes` | Content types to create when their keys do not already exist. |
| `contents` | Pages, posts, or other entries associated with a declared content type. |
| `menus` | Menus and nested menu items to create. |

This example creates a home page, a post, and a primary menu:

```json
{
  "id": "com.example.theme.corporate",
  "name": "Corporate",
  "version": "0.1.0",
  "author": { "name": "Example Studio" },
  "engine": ">=0.1.0",
  "entry": "dist/index.mjs",
  "styles": "dist/theme.css",
  "templates": ["home", "page", "post", "archive", "notFound", "error"],
  "menuLocations": [{ "key": "primary", "name": "Primary menu" }],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "siteTitle": { "type": "string", "title": "Site title", "default": "" },
      "tagline": { "type": "string", "title": "Tagline", "default": "" }
    }
  },
  "demo": {
    "settings": {
      "siteTitle": "Acme Studio",
      "tagline": "A demonstration site"
    },
    "contentTypes": [
      {
        "key": "page",
        "name": "Page",
        "pluralName": "Pages",
        "routePrefix": "",
        "hasBlocks": true,
        "fields": []
      },
      {
        "key": "post",
        "name": "Post",
        "pluralName": "Posts",
        "routePrefix": "blog",
        "hasBlocks": true,
        "fields": []
      }
    ],
    "contents": [
      {
        "contentType": "page",
        "locale": "en",
        "slug": "",
        "title": "Welcome to Acme Studio",
        "excerpt": "The home page included with the theme demo.",
        "blocks": [
          {
            "id": "demo-home-intro",
            "type": "core/richtext",
            "props": { "html": "<h2>Build something clear.</h2><p>Edit this page in Z-CMS Admin.</p>" }
          }
        ],
        "seo": {
          "title": "Acme Studio",
          "description": "A demonstration site built with Z-CMS."
        },
        "status": "PUBLISHED"
      },
      {
        "contentType": "post",
        "locale": "en",
        "slug": "hello-world",
        "title": "Hello world",
        "data": { "readingTime": 2 },
        "blocks": []
      }
    ],
    "menus": [
      {
        "key": "primary",
        "name": "Primary menu",
        "items": [
          { "label": "Home", "url": "/" },
          {
            "label": "Blog",
            "url": "/blog",
            "children": [
              { "label": "Hello world", "url": "/blog/hello-world" }
            ]
          }
        ]
      }
    ]
  }
}
```

Every item in `contents` must reference a key included in `demo.contentTypes`. The seeder does not infer a content type from the site's existing content model.

## Content type fields

Each content type requires `key`, `name`, and `pluralName`. It can also declare:

- `description`, `icon`, and `fields` for the editor.
- `isSingleton` and `isRoutable` to control its behavior.
- `routePrefix` for routed entries, such as `blog`.
- `hasBlocks` to enable the block editor.

If the site already has a content type with the same key, Z-CMS reuses it without changing its schema. Make demo entries compatible with both the declaration in the theme and an existing type that uses that key.

## Content fields and translations

Each content item requires `contentType`, `locale`, `slug`, and `title`. Optional fields are `translationGroup`, `excerpt`, `data`, `blocks`, `seo`, `status`, and `publishedAt`.

- `data` contains values for the content type's structured fields.
- `blocks` uses the same block document shape rendered by `ctx.renderBlocks()`.
- `status` accepts `DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED`, or `ARCHIVED` and defaults to `PUBLISHED`.
- `publishedAt` is an ISO 8601 date-time string. If omitted, the seed time is used.
- Give translations of the same entry an identical `translationGroup` value. Without it, each item forms a separate translation group.
- Use an empty slug (`""`) for a root page only when that matches the site's routing design.

Only use block types that the theme can render, and give every block a stable, unique `id`.

## Menus and settings

A menu requires `key`, `name`, and an `items` array. Each item requires `label` and `url`; `target` and recursive `children` are optional. Match menu keys to locations declared in `menuLocations` when the demo is intended to fill those locations.

Keys in `demo.settings` should also exist in `settingsSchema`. Seeding merges these values over the active theme's current settings; unrelated settings remain unchanged.

## Understand reseeding

Running **Reseed demo** replaces only content and menus previously created for the same theme. Ordinary site content and demo rows owned by other themes remain untouched. Existing content types are retained, and demo settings are merged again.

Because editors may have changed seeded rows, treat reseeding as a destructive operation for that theme's demo content. Do not instruct users to reseed after they have started adapting demo entries into real content.

:::note[Seeding is always a manual admin action]
Installing or updating a theme never seeds or reseeds demo content on its own. When you publish a new version whose demo data changed — corrected translations, added pages, extra menus — sites that already seeded the previous version keep their existing demo content until an administrator opens **Appearance** and clicks **Reseed demo** for the active theme. A fresh install shows no demo content until an administrator clicks **Seed demo**. Call this out in your changelog so operators know a reseed is required to pick up the change.
:::

## Test before packaging

1. Activate the theme on an empty test site and run **Seed demo**.
2. Verify routes, blocks, menus, settings, SEO, and every locale.
3. Edit an ordinary non-demo entry, reseed, and confirm that the entry remains unchanged.
4. Edit a seeded entry, reseed, and confirm that replacement behavior is clearly communicated.
5. Test the theme on a site without demo data to verify its empty states.
6. Build and package the theme, then install that package on a clean site and repeat the seed test.
