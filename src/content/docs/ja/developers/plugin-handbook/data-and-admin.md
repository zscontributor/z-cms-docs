---
title: データテーブルと管理画面
description: プラグインに独自のテーブル、サイドバーメニュー、CRUD 画面を持たせる — manifest で宣言し、コアがレンダリングし、ローカライズされる。
sidebar:
  order: 4
---

first-party プラグインはリレーショナルテーブルを所有し、完全な管理画面 — サイドバーのエントリ、一覧、そして自身のデータに対する作成／編集フォーム — を提供できます。テーブルと画面は manifest で **宣言** します。コアがテーブルを作成し、画面をレンダリングし、パーミッションを強制します。プラグインは管理コードを一切同梱せず、SQL も書きません。これが、開発者がコアに手を加えることなく Z-CMS 上に人事ディレクトリ、CRM、資産台帳、チケットキューを構築する方法です。

:::note[これが必要になるとき]
まずは `ctx.storage` を検討してください。ほとんどのプラグインはリレーショナルテーブルを必要としません。一覧・フィルタ・編集を行う、真にリレーショナルなデータがある場合にのみ `database.tables` を宣言してください。テーブルを所有できるのは **first-party** の特権です。コミュニティプラグインはインストール時に `database` ブロックを拒否され、代わりに `ctx.storage` を使います。
:::

## ステップ 1: テーブルを宣言する

`database.tables` エントリを追加します。コアはその記述を `CREATE TABLE` DDL に変換します。SQL を書くことは決してないため、プラグインが選んだ文字列は、検証済みの識別子としてでなければデータベースに到達しません。

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

プラットフォームがインストール時に強制するルール:

- **すべてのテーブル名はプラグインのプレフィックスで始まる** — `p_` + ドットをアンダースコアに置き換えた id + `__`。プレフィックス外のテーブルは拒否されます。プラグインは `content`、`users`、あるいは他のプラグインのテーブルに名前を付けることはできません。
- **カラムの型** は閉じた集合です: `text`、`integer`、`bigint`、`boolean`、`numeric`、`timestamptz`、`uuid`、`jsonb`。
- **カラムはデフォルトで `NOT NULL`。** 任意のカラムには `"nullable": true` を、あるいは定数の `"default"`（リテラル、または `timestamptz` の `"now()"`）を設定します。
- **コアはすべてのテーブルで 5 つのカラムを所有します** — `id`、`tenant_id`、`site_id`、`created_at`、`updated_at`。これらを宣言することはできませんが、インデックスを張ることはできます（特に `site_id`）。すべての行は Postgres の行レベルセキュリティによってテナントごとに分離されます。

行は実行時に [`ctx.db`](/ja/developers/plugin-handbook/runtime-api/#ctxdb--the-plugins-own-tables) を通じて到達され、すべてのクエリが現在のサイトとテナントにスコープされます。

## ステップ 2: 画面を守るパーミッションを導入する

プラグインの画面を守るのはコアの役目ではないため、プラグインは `permissionsProvided` で **自身の** パーミッションキーを持ち込みます。`defaultRoles` は、プラグインが有効になった時点で各キーをどのロールが保持するかを指定します。

```json
{
  "permissionsProvided": [
    { "key": "crm:read", "description": "See the customer list.", "defaultRoles": ["EDITOR", "ADMIN", "OWNER"] },
    { "key": "crm:manage", "description": "Add, edit and remove customers.", "defaultRoles": ["ADMIN", "OWNER"] }
  ]
}
```

first-party プラグインは `crm:read` のような裸のキーを発行できますが、コミュニティプラグインが提供するキーは名前空間化されなければなりません（`x:<slug>:…`）。これらは `permissions` とは別物であり、`permissions` はプラグインが *要求する* コアスコープです — [パーミッション](/ja/developers/plugin-handbook/permissions/) を参照してください。

## ステップ 3: メニューと画面を追加する

`admin` ブロックはサイドバーのエントリ（`nav`）とリソース（`resources`）— 1 つのテーブルに対する一覧とフォーム — を宣言します。コアは両方をレンダリングし、あなたが指定したパーミッションでゲートします。

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

`nav`、`list`、`form` が指定するすべてのカラムはバッキングテーブル上に存在しなければならず、すべてのパーミッションはプラグインが提供するものでなければなりません。コアはこれをインストール時に検証し、宙に浮いた参照を持つコントリビューションを拒否します。`write` パーミッションを持たないリソースは、全員にとって読み取り専用です。

### フィールドの入力タイプ

フォームの入力はカラムの型から推論されますが、`input` で明示的に設定することもできます。

| `input` | レンダリング | 適したカラム型 |
| --- | --- | --- |
| `text` | 単一行の入力 | `text`, `uuid` |
| `textarea` | 複数行の入力 | `text` |
| `richtext` | リッチテキストエディタ（HTML を保存） | `text` |
| `number` | 数値入力 | `integer`, `bigint`, `numeric` |
| `boolean` | チェックボックス | `boolean` |
| `date` | 日時ピッカー | `timestamptz` |
| `select` | `options` のドロップダウン | `text` |
| `media` | メディアライブラリピッカー（メディア id を保存） | `uuid`, `text` |
| `reference` | 関連する行の id | `uuid`, `text` |

コアは投稿された各値をそのカラムの宣言された型に変換し、書き込みの前に検証します。空の数値、不正な日付、UUID でない値は、データベースの失敗ではなく、明確でローカライズされたエラーとして返ってきます。

## ステップ 4: すべてのラベルをローカライズする

どのラベルも — `nav`、リソース、カラム、フィールド、あるいは `select` のオプション — プレーンな文字列 **または** `{ en, vi, ja }` マップにできます。コアはそれを読者の言語に解決し（英語にフォールバック）、1 つのインストール済みプラグインが管理者の話すあらゆる言語を話します。マップでは英語（`en`）が必須です。

```json
{
  "label": { "en": "Customers", "vi": "Khách hàng", "ja": "顧客" }
}
```

`select` では、**label** はローカライズしても **value** は決してローカライズしません。value は行に保存されるものであり、言語をまたいで安定していなければなりません。

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

プレーン文字列のラベルは以前とまったく同じように動作し続けます。ローカライズはフィールドごとのオプトインです。

## ステップ 5: 有効化時にデフォルトをシードする

`setup` を使ってデモ行やデフォルト行をシードします。冪等にしてください。`setup` は有効化のたびに再実行され、`ctx.db` はすでにこのサイトにスコープされているため、「空」は「このサイトはまだシードされていない」を意味します。

```ts
setup: async (ctx) => {
  const table = "p_com_example_plugin_crm__customers";
  const existing = await ctx.db.select(table, { limit: 1 });
  if (existing.length === 0) {
    await ctx.db.insert(table, { name: "First lead", stage: "lead" });
  }
},
```

## コアが強制すること

- テーブル名はプレフィックスの内側にある。コアが DDL を発行し、プラグインは SQL を一切書かない。
- すべての `nav`/`list`/`form` のカラムはテーブル上に存在し、すべてのパーミッションはあなたが提供するものである。
- 各行は、トークンと Postgres RLS によって、あらゆる読み書きで現在のテナントとサイトにスコープされる。
- 投稿されたフォームの値は、書き込みの前にカラムの型に対して変換・検証される。

同梱の **Customers (CRM)** プラグイン（Z-CMS ソース内の `plugins/crm`）は、このページのすべてを網羅する完全に動作する実例です。
