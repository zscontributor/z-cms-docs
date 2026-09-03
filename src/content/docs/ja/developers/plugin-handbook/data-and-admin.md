---
title: データテーブルと管理画面
description: マニフェストで専用テーブル、メニュー、多言語対応の管理画面を定義する方法を説明します。
sidebar:
  order: 4
---

Z-CMS が提供するプラグイン（first-party）は、専用のリレーショナルテーブルと管理画面を追加できます。管理画面には、サイドバーメニュー、一覧、作成・編集フォームが含まれます。テーブルと画面をマニフェストで宣言すると、Z-CMS のコアがテーブル作成、画面表示、権限チェックを行います。SQL や管理画面のコードを個別に書かずに、社員名簿、CRM、資産台帳、問い合わせ管理などを構築できます。

:::note[専用テーブルが必要な場合]
まずは `ctx.storage` を検討してください。多くのプラグインでは専用テーブルは不要です。リレーショナルデータを一覧表示、検索、編集する必要がある場合に限り、`database.tables` を宣言します。専用テーブルを作れるのは Z-CMS 提供のプラグインだけです。コミュニティ製プラグインの `database` ブロックはインストール時に拒否されるため、`ctx.storage` を利用してください。
:::

## ステップ 1：テーブルを宣言する

`database.tables` にテーブル定義を追加します。コアがこの定義から DDL の `CREATE TABLE` を生成します。プラグインから SQL を直接送ることはできず、テーブル名やカラム名も検証済みの識別子としてのみ使用されます。

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

インストール時には、次のルールが検証されます。

- **テーブル名はプラグイン固有の接頭辞で始めます。** 接頭辞は `p_` + ID のドットをアンダースコアに置き換えた文字列 + `__` です。範囲外の名前は拒否され、`content`、`users`、他のプラグインのテーブル名は使えません。
- **利用できるカラム型は限定されています。** `text`、`integer`、`bigint`、`boolean`、`numeric`、`timestamptz`、`uuid`、`jsonb` を使用できます。
- **カラムはデフォルトで `NOT NULL` です。** 省略可能なカラムには `"nullable": true` を指定するか、`"default"` に固定値を設定します。`timestamptz` では `"now()"` も指定できます。
- **五つのカラムはコアが管理します。** `id`、`tenant_id`、`site_id`、`created_at`、`updated_at` は再定義できませんが、インデックスの対象にはできます。特に `site_id` のインデックスを検討してください。各行は PostgreSQL の行レベルセキュリティでテナントごとに分離されます。

実行時には [`ctx.db`](/ja/developers/plugin-handbook/runtime-api/#ctxdb--プラグイン自身のテーブル) でデータにアクセスします。すべてのクエリは、現在のサイトとテナントに制限されます。

## ステップ 2：管理画面の権限を定義する

プラグインの管理画面では、`permissionsProvided` で定義した独自の権限を使います。コアの画面用の権限が自動的に適用されるわけではありません。`defaultRoles` には、プラグインの有効化時に各権限を付与するロールを指定します。

```json
{
  "permissionsProvided": [
    { "key": "crm:read", "description": "See the customer list.", "defaultRoles": ["EDITOR", "ADMIN", "OWNER"] },
    { "key": "crm:manage", "description": "Add, edit and remove customers.", "defaultRoles": ["ADMIN", "OWNER"] }
  ]
}
```

Z-CMS 提供のプラグインは `crm:read` のような権限キーを定義できます。コミュニティ製プラグインは `x:<slug>:…` の形式で名前空間を付ける必要があります。これは、プラグインが利用を要求するコアの権限を列挙した `permissions` とは別のものです。[プラグインの権限](/ja/developers/plugin-handbook/permissions/) を参照してください。

## ステップ 3：メニューと画面を追加する

`admin` ブロックでは、サイドバーの項目（`nav`）と管理対象（`resources`）を宣言します。各リソースは、一つのテーブルに対応する一覧とフォームを持ちます。画面表示と指定された権限によるアクセス制御は、コアが担当します。

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

`nav`、`list`、`form` で参照するカラムは、対象テーブルに存在する必要があります。指定する権限も、そのプラグインが提供するものに限られます。コアはインストール時に参照先を検証し、不正な定義を拒否します。`write` 権限が定義されていないリソースは、すべてのユーザーに対して読み取り専用になります。

### フィールドの入力タイプ

フォームの入力はカラムの型から推論されますが、`input` で明示的に設定することもできます。

| `input` | 表示される入力欄 | 対応するカラム型 |
| --- | --- | --- |
| `text` | 一行のテキスト入力 | `text`, `uuid` |
| `textarea` | 複数行のテキスト入力 | `text` |
| `richtext` | リッチテキストエディター。HTML で保存します。 | `text` |
| `number` | 数値入力 | `integer`, `bigint`, `numeric` |
| `boolean` | チェックボックス | `boolean` |
| `date` | 日時の選択 | `timestamptz` |
| `select` | `options` に定義した選択肢の一覧 | `text` |
| `media` | メディアライブラリから選択し、メディアの ID を保存 | `uuid`, `text` |
| `reference` | 関連レコードの ID | `uuid`, `text` |

コアはフォームから送信された値をカラムの型に変換し、保存前に検証します。必須の数値が空欄、不正な日付、UUID の形式が違うといった場合は、データベースのエラーではなく、画面の言語に合わせた分かりやすいエラーメッセージを返します。

## ステップ 4：ラベルを多言語化する

メニュー、リソース、カラム、フィールド、`select` の選択肢のラベルには、通常の文字列または `{ en, vi, ja }` 形式の翻訳オブジェクトを指定できます。コアが利用者の言語に合うラベルを選び、該当する翻訳がなければ英語を表示します。翻訳オブジェクトには `en` が必須です。

```json
{
  "label": { "en": "Customers", "vi": "Khách hàng", "ja": "顧客" }
}
```

`select` では **label** だけを翻訳し、**value** は変更しないでください。`value` はデータベースに保存されるため、どの言語でも同じ値を使う必要があります。

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

通常の文字列のラベルも、そのまま利用できます。多言語化するかどうかは、ラベルごとに選べます。

## ステップ 5：有効化時に初期データを登録する

`setup` でサンプルデータや初期データを登録します。有効化のたびに実行されるため、繰り返し実行してもデータが重複しないようにしてください。`ctx.db` は現在のサイトに制限されているので、検索結果が空なら、そのサイトにはまだデータがないと判断できます。

```ts
setup: async (ctx) => {
  const table = "p_com_example_plugin_crm__customers";
  const existing = await ctx.db.select(table, { limit: 1 });
  if (existing.length === 0) {
    await ctx.db.insert(table, { name: "First lead", stage: "lead" });
  }
},
```

## ステップ 6：検索・絞り込みに対応した一覧をテーマに表示する

ここまでの画面は管理者向けです。商品一覧、店舗検索、求人情報などを公開サイトに表示するには、テーマにプラグインのデータを渡す必要があります。テーマ自体はサーバーで HTML を生成し、独自の JavaScript を含まないため、ブラウザーから直接クエリを実行できません。そこでプラグインが公開クエリに応答し、ランタイムのウィジェットがブラウザー側でデータを取得して表示します。

実装は次の二つに分かれます。公開 [フォーム](/ja/developers/plugin-handbook/permissions/) と同様に、プラグイン側とテーマ側で役割を分担します。

**1. プラグインに `query` ハンドラーを実装します。** マニフェストでケイパビリティを宣言し、固定名 `query` の呼び出しを実装します。ハンドラーは検索条件を `params` で受け取り、行の配列または `{ items }` を返します。公開されるのはこの呼び出しだけで、訪問者が任意のハンドラーを実行することはできません。

```json
{ "capabilities": ["catalog.search"] }
```

```ts
export default definePlugin({
  manifest: { /* … capabilities: ["catalog.search"] … */ },
  calls: {
    // Reached at /plugin-query/catalog.search?q=serum&stage=active
    query: async ({ params }, ctx) => {
      const where: Record<string, unknown> = {};
      if (params.stage) where.stage = params.stage;                       // equality
      if (params.q) where.title = { op: "contains", value: params.q };    // substring
      const items = await ctx.db.select("p_com_example_plugin_shop__products", {
        where,
        orderBy: { column: "title", direction: "asc" },
        limit: 60,
      });
      return { items };
    },
  },
});
```

`params` は、URL のクエリパラメーターをコアが検証・整形した、小さな文字列のマップです。どのパラメーターを検索条件に使うかは、ハンドラーで明示的に決めます。`ctx.db` によるカラムの検証とサイト単位のアクセス制限は引き続き適用されます。

**2. テーマに検索フォームと結果表示用テンプレートを用意します。** テーマが出力する HTML に `data-zc-*` 属性を付けると、ランタイムのウィジェットが機能を追加します。フォーム送信時、または `data-zc-auto` がある場合は入力時に `/plugin-query/<capability>` を呼び出し、結果をテンプレートに反映します。値はテキストとして挿入し、リンクは HTTP(S) または相対 URL に限定するため、行データが HTML として解釈されることはありません。

```html
<form data-zc-query="catalog.search" data-zc-target="#results" data-zc-auto>
  <input name="q" type="search" placeholder="Search…" />
  <select name="stage">
    <option value="">All</option>
    <option value="active">In stock</option>
  </select>
</form>

<ul id="results">
  <template data-zc-query-item>
    <li>
      <a data-zc-href="url"><span data-zc-field="title"></span></a>
      <span data-zc-field="price"></span>
    </li>
  </template>
  <li data-zc-query-empty hidden>No matches.</li>
  <li data-zc-query-error hidden>Could not load results.</li>
</ul>
```

各属性の役割は次のとおりです。

- `<form>` の `data-zc-query="<capability>"`：`name` 属性のある入力欄をクエリパラメーターとして送信します。
- `data-zc-target="#sel"`：結果の表示先を指定します。省略時はフォームの直後の要素です。`data-zc-auto` は入力時、`data-zc-initial` はページ読み込み時にデータを取得します。
- `<template data-zc-query-item>`：結果の一行分のテンプレートです。`data-zc-field="col"` でカラムの値をテキストとして挿入し、`data-zc-href="col"` で検証済みのリンクを設定します。
- `[data-zc-query-empty]` と `[data-zc-query-error]`：必要に応じて用意する要素です。結果が空の場合、または取得に失敗した場合に表示されます。

JavaScript が無効でも、サーバーで生成した HTML（絞り込み前の一覧など）は表示されます。ウィジェットは、その表示に検索と結果の更新機能を追加します。公開クエリのエンドポイントは読み取り専用で、IP アドレスごとに呼び出し頻度が制限されます。

:::caution[公開クエリはログインなしでアクセスできる]
`query` ハンドラーの戻り値は、ログインしていない訪問者にも公開されます。公開可能なフィールドだけを返し、原価、個人のメールアドレス、内部メモなどは含めないでください。上記の顧客管理画面のような、社内向けの一覧を公開クエリで提供してはいけません。
:::

## コアが検証・制御する内容

- テーブル名にはプラグイン固有の接頭辞が必要です。DDL はコアが生成し、プラグインから SQL は送信できません。
- `nav`/`list`/`form` の参照先カラムが存在し、指定された権限をプラグインが提供していることを確認します。
- すべての読み書きを、トークンと PostgreSQL RLS によって現在のテナントとサイトに制限します。
- フォームの値をカラムの型に変換・検証してから保存します。

Z-CMS のソースには、動作を確認できる二つの実装例があります。**Customers (CRM)**（`plugins/crm`）はテーブルと管理画面を、**Product Catalog**（`plugins/catalog`）はステップ 6 の公開クエリ `catalog.search` と商品一覧の絞り込み機能を実装しています。
