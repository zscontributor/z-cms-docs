---
title: サンプルデータを提供する
description: テーマから設定、コンテンツタイプ、ページ、メニューなどのサンプルデータを作成する方法を説明します。
sidebar:
  order: 4
---

テーマには、`theme.json` の `demo` フィールドでサンプルデータを定義できます。有効なテーマに対して `theme:configure` 権限を持つ管理者が **Appearance → Seed demo** を実行すると、そのデータが作成されます。

データは `theme.json` に直接記述します。現在の仕様では別の `demo.json` は読み込みません。マニフェストに含まれるため、サンプルデータも署名済みパッケージの一部になります。

:::caution[サンプルデータは試用向けです]
新規サイトかステージング環境で、**Seed demo**（サンプルデータの作成）と **Reseed demo**（再作成）の両方をテストしてください。コンテンツタイプ、公開済みコンテンツ、メニュー、テーマ設定が作成される場合があります。テーマはサンプルデータがなくても動作し、データが空の場合に適した表示を用意する必要があります。
:::

## サンプルデータを定義する

`demo` オブジェクトは、次の 4 つの任意セクションをサポートします。

| フィールド | 用途 |
| --- | --- |
| `settings` | 有効なテーマの既存設定に適用する値。 |
| `contentTypes` | 同じキーの定義がない場合に作成するコンテンツタイプ。 |
| `contents` | 宣言したコンテンツタイプに属するページや記事など。 |
| `menus` | 作成するメニューとその子項目。 |

次の例では、ホームページ、記事、プライマリメニューを作成します。

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
      "siteTitle": { "type": "string", "title": "サイト名", "default": "" },
      "tagline": { "type": "string", "title": "タグライン", "default": "" }
    }
  },
  "demo": {
    "settings": {
      "siteTitle": "Acme Studio",
      "tagline": "デモンストレーションサイト"
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
        "locale": "ja",
        "slug": "",
        "title": "Acme Studio へようこそ",
        "excerpt": "テーマのデモに含まれるホームページです。",
        "blocks": [
          {
            "id": "demo-home-intro",
            "type": "core/richtext",
            "props": { "html": "<h2>分かりやすいものを作りましょう。</h2><p>Z-CMS Admin でこのページを編集できます。</p>" }
          }
        ],
        "seo": {
          "title": "Acme Studio",
          "description": "Z-CMS で構築したデモンストレーションサイトです。"
        },
        "status": "PUBLISHED"
      },
      {
        "contentType": "post",
        "locale": "ja",
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
          { "label": "ホーム", "url": "/" },
          {
            "label": "ブログ",
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

`contents` の各項目は、`demo.contentTypes` に宣言したキーを参照する必要があります。サイトの既存のデータ構造からコンテンツタイプが自動で推測されることはありません。

## コンテンツタイプのフィールド

各コンテンツタイプには `key`、`name`、`pluralName` が必要です。次の項目も宣言できます。

- エディター用の `description`、`icon`、`fields`。
- サイトごとに一件のみ作成できるかを指定する `isSingleton` と、個別 URL を持つかを指定する `isRoutable`。
- URL の接頭辞を指定する `routePrefix`（例：`blog`）。
- ブロックエディターを有効にする `hasBlocks`。

同じキーのコンテンツタイプがすでにある場合、Z-CMS はそのスキーマを変更せずに再利用します。サンプルデータは、テーマ内の定義と、同じキーを持つ既存のコンテンツタイプの両方に適合する必要があります。

## コンテンツフィールドと翻訳

各コンテンツ項目には `contentType`、`locale`、`slug`、`title` が必要です。任意フィールドは `translationGroup`、`excerpt`、`data`、`blocks`、`seo`、`status`、`publishedAt` です。

- `data` には、コンテンツタイプの構造化フィールドの値を入れます。
- `blocks` は、`ctx.renderBlocks()` が表示できるブロック形式を使います。
- `status` は `DRAFT`、`IN_REVIEW`、`SCHEDULED`、`PUBLISHED`、`ARCHIVED` のいずれかで、既定値は `PUBLISHED` です。
- `publishedAt` は ISO 8601 形式の日時文字列です。省略時はサンプルデータの作成時刻を使います。
- 同じコンテンツの翻訳には同じ `translationGroup` を指定します。省略すると、各項目は別の翻訳グループになります。
- 空のスラッグ（`""`）は、サイトの URL 設計に合う場合に限り、ルートページに使用します。

テーマが表示できるブロックタイプだけを使い、各ブロックに一意で変更されない `id` を付けてください。

## メニューと設定

各メニューには `key`、`name`、`items` 配列が必要です。各項目に `label` と `url` を指定し、必要に応じて `target` や入れ子の子項目 `children` を追加します。テーマの所定の位置にサンプルメニューを表示するには、メニューのキーを `menuLocations` の宣言と一致させてください。

`demo.settings` のキーは、`settingsSchema` にも定義してください。サンプルデータの作成時に指定値を現在のテーマ設定へ適用し、関係のない設定は保持します。

## サンプルデータを再作成するとどうなるか

**Reseed demo** は、同じテーマが以前に作成したコンテンツとメニューだけを置き換えます。通常のコンテンツや別のテーマのサンプルデータは変更しません。既存のコンテンツタイプは保持され、サンプル用の設定が再び適用されます。

サンプルから作成したレコードを編集している場合、再作成するとその変更が失われます。サンプルを実際のコンテンツとして使い始めた後は、安易に **Reseed demo** を案内しないでください。

:::note[作成・再作成は管理者が手動で行います]
テーマをインストールまたは更新しても、サンプルデータは自動で作成・更新されません。新しいバージョンで翻訳、ページ、メニューを変更しても、既存サイトにはそのままのデータが残ります。反映するには、管理者が **Appearance** で有効なテーマの **Reseed demo** を実行する必要があります。初めて作成する場合は **Seed demo** を使います。再作成が必要なことと、編集済みのサンプルデータが上書きされることを、変更履歴に明記してください。
:::

## パッケージ化前にテストする

1. 空のテストサイトでテーマを有効にし、**Seed demo** を実行します。
2. URL、ブロック、メニュー、設定、SEO、すべての言語を確認します。
3. サンプル以外のコンテンツを編集し、再作成後も変更が残ることを確認します。
4. サンプルのレコードを編集して再作成し、置き換えの動作と注意書きが一致することを確認します。
5. サンプルデータがないサイトでも、適切に表示されることを確認します。
6. テーマをビルドしてパッケージ化し、未使用のテストサイトにインストールして作成手順を再確認します。
