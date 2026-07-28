---
title: Data tables and admin screens
description: Give a plugin its own table, a sidebar menu and CRUD screens — declared in the manifest, rendered by core, and localized.
sidebar:
  order: 4
---

A first-party plugin can own relational tables and contribute a full management screen — a sidebar entry, a list, and a create/edit form over its own data. You **declare** the table and the screen in the manifest; core creates the table, renders the screen, and enforces the permissions. The plugin ships no admin code and writes no SQL. This is how a developer builds an HR directory, a CRM, an asset register or a ticket queue on Z-CMS without touching core.

:::note[When you need this]
Reach for `ctx.storage` first — most plugins never need a relational table. Declare `database.tables` only when you have genuinely relational data to list, filter and edit. Owning tables is a **first-party** privilege; a community plugin is refused a `database` block at install and uses `ctx.storage` instead.
:::

## Step 1: Declare a table

Add a `database.tables` entry. Core turns the description into `CREATE TABLE` DDL — you never write SQL, so no plugin-chosen string reaches the database as anything but an already-validated identifier.

```json
{
  "database": {
    "tables": [
      {
        "name": "p_com_example_plugin_crm__customers",
        "columns": [
          { "name": "name", "type": "text" },
          { "name": "email", "type": "text", "nullable": true },
          { "name": "stage", "type": "text", "default": "lead" },
          { "name": "deal_value", "type": "numeric", "nullable": true },
          { "name": "notes", "type": "text", "nullable": true },
          { "name": "last_contacted", "type": "timestamptz", "nullable": true },
          { "name": "avatar", "type": "uuid", "nullable": true }
        ],
        "indexes": [
          { "columns": ["email"], "unique": true },
          { "columns": ["stage"] }
        ]
      }
    ]
  }
}
```

Rules the platform enforces at install:

- **Every table name starts with your plugin's prefix** — `p_` + your id with dots as underscores + `__`. A table outside the prefix is refused. A plugin cannot name `content`, `users`, or another plugin's table.
- **Column types** are a closed set: `text`, `integer`, `bigint`, `boolean`, `numeric`, `timestamptz`, `uuid`, `jsonb`.
- **Columns are `NOT NULL` by default.** Set `"nullable": true` for optional ones, or a constant `"default"` (a literal, or `"now()"` on a `timestamptz`).
- **Core owns five columns on every table** — `id`, `tenant_id`, `site_id`, `created_at`, `updated_at`. You may not declare them, but you may index them (`site_id` especially). Every row is isolated per tenant by Postgres row-level security.

Rows are reached at runtime through [`ctx.db`](/en/developers/plugin-handbook/runtime-api/#ctxdb--the-plugins-own-tables), which scopes every query to the current site and tenant.

## Step 2: Introduce permissions to guard the screen

A plugin's screen is not core's to guard, so the plugin **brings its own** permission keys with `permissionsProvided`. `defaultRoles` says which roles hold each key the moment the plugin is active.

```json
{
  "permissionsProvided": [
    { "key": "crm:read", "description": "See the customer list.", "defaultRoles": ["EDITOR", "ADMIN", "OWNER"] },
    { "key": "crm:manage", "description": "Add, edit and remove customers.", "defaultRoles": ["ADMIN", "OWNER"] }
  ]
}
```

A first-party plugin may mint bare keys like `crm:read`; a community plugin's provided keys must be namespaced (`x:<slug>:…`). These are distinct from `permissions`, which are the core scopes the plugin *requests* — see [Permissions](/en/developers/plugin-handbook/permissions/).

## Step 3: Add a menu and screens

The `admin` block declares a sidebar entry (`nav`) and a resource (`resources`) — a list and a form over one table. Core renders both, gated by the permissions you named.

```json
{
  "admin": {
    "nav": [
      { "label": "Customers", "icon": "users", "resource": "customers", "permission": "crm:read" }
    ],
    "resources": [
      {
        "key": "customers",
        "label": "Customers",
        "table": "p_com_example_plugin_crm__customers",
        "list": {
          "columns": [
            { "column": "name", "label": "Name" },
            { "column": "email", "label": "Email" },
            { "column": "stage", "label": "Stage" }
          ],
          "orderBy": { "column": "name", "direction": "asc" }
        },
        "form": {
          "fields": [
            { "column": "name", "label": "Name" },
            { "column": "email", "label": "Email" },
            { "column": "stage", "label": "Stage", "input": "select",
              "options": [
                { "value": "lead", "label": "Lead" },
                { "value": "customer", "label": "Customer" }
              ] },
            { "column": "deal_value", "label": "Deal value", "input": "number" },
            { "column": "last_contacted", "label": "Last contacted", "input": "date" },
            { "column": "notes", "label": "Notes", "input": "textarea" },
            { "column": "avatar", "label": "Avatar", "input": "media" }
          ]
        },
        "permissions": { "read": "crm:read", "write": "crm:manage" }
      }
    ]
  }
}
```

Every column a `nav`, `list` or `form` names must exist on the backing table, and every permission must be one the plugin provides — core validates this at install and refuses a contribution that dangles a reference. A resource with no `write` permission is read-only for everyone.

### Field input types

The form input is inferred from the column type, or you can set it explicitly with `input`:

| `input` | Renders | Good for column type |
| --- | --- | --- |
| `text` | Single-line input | `text`, `uuid` |
| `textarea` | Multi-line input | `text` |
| `richtext` | Rich-text editor (stores HTML) | `text` |
| `number` | Number input | `integer`, `bigint`, `numeric` |
| `boolean` | Checkbox | `boolean` |
| `date` | Date-time picker | `timestamptz` |
| `select` | Dropdown of `options` | `text` |
| `media` | Media library picker (stores a media id) | `uuid`, `text` |
| `reference` | Id of a related row | `uuid`, `text` |

Core coerces each posted value to its column's declared type and validates it before the write — a blank number, a bad date or a non-UUID comes back as a clear, localized error instead of a database failure.

## Step 4: Localize every label

Any label — a `nav`, resource, column, field, or a `select` option — can be a plain string **or** a `{ en, vi, ja }` map. Core resolves it to the reader's language (falling back to English), so one installed plugin speaks every language the admin does. English (`en`) is required in a map.

```json
{
  "label": { "en": "Customers", "vi": "Khách hàng", "ja": "顧客" }
}
```

For a `select`, localize the **label** but never the **value** — the value is what gets stored in the row and must stay stable across languages:

```json
{
  "column": "stage",
  "label": { "en": "Stage", "vi": "Giai đoạn", "ja": "ステージ" },
  "input": "select",
  "options": [
    { "value": "lead",     "label": { "en": "Lead", "vi": "Tiềm năng", "ja": "リード" } },
    { "value": "customer", "label": { "en": "Customer", "vi": "Khách hàng", "ja": "顧客" } }
  ]
}
```

A plain-string label keeps working exactly as before — localization is opt-in, field by field.

## Step 5: Seed defaults on activation

Use `setup` to seed demo or default rows. Make it idempotent — `setup` re-runs on every activation, and `ctx.db` is already scoped to this site, so "empty" means "this site has not been seeded yet".

```ts
setup: async (ctx) => {
  const table = "p_com_example_plugin_crm__customers";
  const existing = await ctx.db.select(table, { limit: 1 });
  if (existing.length === 0) {
    await ctx.db.insert(table, { name: "First lead", stage: "lead" });
  }
},
```

## What core enforces

- The table name is inside your prefix; core emits the DDL, the plugin never writes SQL.
- Every `nav`/`list`/`form` column exists on the table; every permission is one you provide.
- Each row is scoped to the current tenant and site on every read and write, by the token and by Postgres RLS.
- Posted form values are coerced and validated against the column types before a write.

The bundled **Customers (CRM)** plugin (`plugins/crm` in the Z-CMS source) is a complete, working example of everything on this page.
