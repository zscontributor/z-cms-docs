---
title: Plugin runtime API
description: The hooks a plugin implements and the ctx APIs it may call, with the scope each one requires.
sidebar:
  order: 3
---

A plugin exports one object built with `definePlugin` from `@zcmsorg/plugin-sdk`. Everything it can *do* is a hook it implements; everything it can *touch* is a method on the `ctx` object it is handed. There is no `require`, no `fs`, no `process.env`, no database handle and no `fetch` inside the sandbox — if a capability is not one of the hooks or `ctx` methods below, a plugin cannot do it.

Every `ctx` method is `async`, because none of them run in the plugin's isolate: they are RPC calls back to the host, which re-checks the plugin's granted scopes on each one. A plugin that never requested `content:read` gets a rejection from the host, not a local check it could have patched out.

## The plugin object

`definePlugin` takes a `manifest` (see [Build your first plugin](/en/developers/plugin-handbook/getting-started/)) and any of these optional hooks:

| Hook | Shape | When it runs | Budget |
| --- | --- | --- | --- |
| `setup(ctx)` | `() => void` | Once, when the plugin is activated on a site — migrations, seed data, defaults. | — |
| `teardown(ctx)` | `() => void` | Once, on deactivation. A throw here is logged and the transition still proceeds. Not uninstall. | — |
| `actions` | `{ [event]: (payload, ctx) => void }` | Fire-and-forget, **after** something happened. The CMS does not wait. | async |
| `filters` | `{ [name]: (value, context, ctx) => value }` | Transforms a value **in-flight**; the caller waits. A filter that overruns its timeout is skipped and the original value is used. | hard-capped |
| `jobs` | `{ [name]: (payload, ctx) => void }` | Deferred work, run when a prior `ctx.jobs.enqueue(name, payload)` is processed off the request path. | 30s |
| `calls` | `{ [name]: (payload, ctx) => unknown }` | Request/response — the CMS calls one and **waits for what it returns**. Reached by capability, not by plugin key. | 30s |

```ts
import { definePlugin } from "@zcmsorg/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "com.example.plugin.hello",
    name: "Hello Plugin",
    version: "0.1.0",
    author: { name: "Example Studio" },
    engine: ">=0.1.0",
    permissions: ["content:read"],
  },

  setup: async (ctx) => {
    ctx.log.info(`Activated on ${ctx.site.name}`);
  },

  actions: {
    "content.published": async (event, ctx) => {
      await ctx.storage.set(`last-published`, event.contentId);
    },
  },
});
```

:::caution[Only these four shapes do work]
A plugin cannot set a timer, open a connection, or run code on its own. It reacts to an **action**, transforms a **filter**, answers a **call**, or asks the platform to run a **job** later. That is the whole of a plugin's control flow.
:::

## Events you can hook

### Actions — fired after the fact, never awaited

| Event | Payload |
| --- | --- |
| `content.created` | `siteId, contentId, contentType, title` |
| `content.updated` | `siteId, contentId, contentType, title` |
| `content.published` | `siteId, contentId, contentType, title, path, publishedAt` |
| `content.unpublished` | `siteId, contentId, contentType` |
| `content.deleted` | `siteId, contentId` |
| `theme.activated` | `siteId, themeKey` |
| `plugin.activated` | `siteId, pluginId` |
| `mail.sent` | `siteId, pluginKey, to[], subject, messageId, sentAt` — a receipt for *every* send on the site, carrying no body. |
| `mail.failed` | `siteId, pluginKey, to[], subject, error, failedAt` |

### Filters — transform a value in-flight, blocking and capped

| Filter | Value | Context |
| --- | --- | --- |
| `content.seo` | `{ title?, description?, ogImage?, noindex?, canonical? }` — a page's metadata, just before the theme renders it. | `siteId, contentId, path, title` |
| `mail.sending` | `{ subject, text?, html?, replyTo?, send }` — an outgoing email just before SMTP. Return `send: false` to cancel delivery. | `siteId, pluginKey, to[]` |

## The `ctx` object

| Property | What it is | Scope required |
| --- | --- | --- |
| `ctx.settings` | The plugin's settings for **this site**, merged with `settingsSchema` defaults. | — |
| `ctx.secrets` | `{ placeholder: boolean }` — which declared `network.secrets` the admin filled in. Never the values. | — |
| `ctx.site` | `{ id, name, locale }` for the current site. | — |
| `ctx.log` | `info / warn / error(message, meta?)`. | — |
| `ctx.storage` | Key-value storage, namespaced to (plugin, site). | — |
| `ctx.db` | The plugin's **own** relational tables. | `data:own` + first-party + declared table |
| `ctx.content` | Read the site's content. | `content:read` |
| `ctx.jobs` | Queue background work. | — |
| `ctx.mail` | Send email through the site's mail server. | `mail:send` |
| `ctx.http` | Reach a declared outside host. | `network:fetch` + `network.hosts` |

### `ctx.storage` — key-value, the default store

```ts
await ctx.storage.set("counter", 3);
const n = await ctx.storage.get<number>("counter"); // 3, or null
await ctx.storage.list("prefix:");                  // [{ key, value }]
await ctx.storage.delete("counter");
```

Reach for this before relational tables. A plugin that uses only `ctx.storage` has no schema footprint at all, and any plugin — community or first-party — may use it. Keys and values are isolated per plugin *and* per site.

### `ctx.db` — the plugin's own tables

Available only to first-party plugins that hold `data:own` and declared the table in `manifest.database`. This is not a database handle: there is no connection, no transaction and no SQL string. You name a table you own and a plain equality filter; the host builds the parameterized query on the far side of the boundary and stamps `tenant_id`/`site_id` from your token on every row.

```ts
await ctx.db.insert("p_com_example_plugin_hello__notes", { title: "Hi", body: "…" });
await ctx.db.select("p_com_example_plugin_hello__notes", {
  where: { title: "Hi" },
  orderBy: { column: "created_at", direction: "desc" },
  limit: 20,
});
await ctx.db.update("…__notes", { body: "edited" }, { id });
await ctx.db.delete("…__notes", { id });
```

See [Data tables and admin screens](/en/developers/plugin-handbook/data-and-admin/) for declaring the table and giving it a menu.

### `ctx.content` — read site content

```ts
const page = await ctx.content.get(contentId);              // ContentDto | null
const posts = await ctx.content.list({ contentTypeKey: "post", status: "PUBLISHED" });
```

Read-only, and gated by `content:read`. Writing content is not on this object — a plugin influences content through `filters` and `actions`, not by writing rows.

### `ctx.jobs` — do work later

```ts
await ctx.jobs.enqueue("sync-catalog", { since: lastRun });
```

The only way a plugin does deferred work. The payload is handed to the matching handler in `jobs` when the queue processes it — same sandbox, same scopes, off the request path, with durability and retries behind it.

### `ctx.mail` — send email

```ts
await ctx.mail.send({ to: "a@b.co", subject: "Hello", text: "…", replyTo: "me@site" });
```

Requires `mail:send`. There is no `from` (the envelope sender is the site's), no SMTP host or credentials, and no delivery result — `send` resolves when the mail is accepted onto the queue. The outcome arrives later as the `mail.sent` / `mail.failed` actions. Sends are rate-limited and deduplicated per site.

### `ctx.http` — reach an outside service

```ts
const res = await ctx.http.fetch({
  url: "https://api.deepl.com/v2/translate",
  method: "POST",
  headers: { Authorization: "DeepL-Auth-Key {{secret:deeplKey}}" },
  body: { text: ["Hello"], target_lang: "VI" },
});
const data = JSON.parse(res.body); // body arrives as text
```

Requires `network:fetch` **and** a `network` block in the manifest naming the host — a plugin cannot reach a host the admin did not see on the consent screen. The gateway refuses private, loopback and link-local addresses (on every redirect too), caps each request at 10s and 1&nbsp;MB, and enforces a per-site hourly quota.

:::note[Spend a key without holding it]
A setting named under `network.secrets` is withheld from `ctx.settings`. Write `{{secret:name}}` where the credential goes; the gateway substitutes the real value **after** the host check, on the far side of the sandbox. A compromised plugin cannot exfiltrate a key it never received.
:::

## Scopes a plugin can request

`manifest.permissions` lists the scopes the admin approves on the consent screen. The ones a plugin most often needs:

| Scope | Grants |
| --- | --- |
| `content:read` | `ctx.content` |
| `content:create` · `content:update` · `content:delete` · `content:publish` | Content writes on the paths that expose them. |
| `media:read` · `media:upload` · `media:update` · `media:delete` | Media library access. |
| `mail:send` | `ctx.mail` |
| `network:fetch` | `ctx.http` (with a `network` declaration) |
| `data:own` | `ctx.db` and a `database` block (first-party only) |

`permissions` are core scopes the plugin **requests to spend**. Do not confuse them with `permissionsProvided`, which are *new* permission keys the plugin **brings into existence** to gate its own screens — see [Data tables and admin screens](/en/developers/plugin-handbook/data-and-admin/) and [Permissions](/en/developers/plugin-handbook/permissions/).

## What is not available

There is no `require`, no `import` of anything but `@zcmsorg/plugin-sdk`, no `fs`, no `process`, no `process.env`, no `fetch`, no `WebSocket`, no timers (`setTimeout`/`setInterval`), and no database or network handle. Bundle to a single CommonJS file (see [Build your first plugin](/en/developers/plugin-handbook/getting-started/)) and reach the outside world only through `ctx`.
