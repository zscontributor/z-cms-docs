---
title: デモコンテンツを提供する
description: 管理者がテーマから作成できる設定、コンテンツタイプ、コンテンツ、メニューを宣言します。
sidebar:
  order: 4
---

テーマは、`theme.json` の `demo` フィールドに任意のデモデータセットを含めることができます。テーマが有効なとき、`theme:configure` 権限を持つ管理者は **Appearance → Seed demo** からデータを適用できます。

データセットは `theme.json` に直接記述します。現在の manifest contract は、別の `demo.json` ファイルを読み込みません。Manifest に含めることで、デモデータも署名済みテーマパッケージの一部になります。

:::caution[デモデータは評価用です]
新規サイトまたは staging 環境で seed と reseed の両方をテストしてください。Seed によって、コンテンツタイプ、公開コンテンツ、メニュー、テーマ設定が作成されることがあります。テーマはデモデータがなくても表示でき、適切な empty state を備えている必要があります。
:::

## Demo 宣言を追加する

`demo` オブジェクトは、次の 4 つの任意セクションをサポートします。

| フィールド | 用途 |
| --- | --- |
| `settings` | 有効なテーマの既存設定に merge する値。 |
| `contentTypes` | 同じ key が存在しない場合に作成するコンテンツタイプ。 |
| `contents` | 宣言したコンテンツタイプに属するページ、記事、その他のエントリー。 |
| `menus` | 作成するメニューとネストしたメニュー項目。 |

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

`contents` の各項目は、`demo.contentTypes` に含まれる key を参照する必要があります。Seeder は、サイトの既存 content model からコンテンツタイプを推測しません。

## コンテンツタイプのフィールド

各コンテンツタイプには `key`、`name`、`pluralName` が必要です。次の項目も宣言できます。

- エディター用の `description`、`icon`、`fields`。
- 動作を制御する `isSingleton` と `isRoutable`。
- `blog` など、route を持つエントリー用の `routePrefix`。
- Block editor を有効にする `hasBlocks`。

同じ key のコンテンツタイプがサイトに存在する場合、Z-CMS は schema を変更せずに再利用します。デモエントリーは、テーマ内の宣言と、同じ key を使用する既存タイプの両方に対応できるようにしてください。

## コンテンツフィールドと翻訳

各コンテンツ項目には `contentType`、`locale`、`slug`、`title` が必要です。任意フィールドは `translationGroup`、`excerpt`、`data`、`blocks`、`seo`、`status`、`publishedAt` です。

- `data` には、コンテンツタイプの構造化フィールドの値を入れます。
- `blocks` は、`ctx.renderBlocks()` が表示する block document と同じ形式です。
- `status` は `DRAFT`、`IN_REVIEW`、`SCHEDULED`、`PUBLISHED`、`ARCHIVED` のいずれかで、既定値は `PUBLISHED` です。
- `publishedAt` は ISO 8601 date-time 文字列です。省略すると seed の実行時刻が使われます。
- 同じエントリーの翻訳には、同一の `translationGroup` 値を指定します。省略すると、各項目は別々の翻訳グループになります。
- 空の slug（`""`）は、サイトの routing design に合う場合にのみルートページへ使用します。

テーマが表示できる block type だけを使い、各 block に安定した一意の `id` を指定してください。

## メニューと設定

各メニューには `key`、`name`、`items` 配列が必要です。各項目には `label` と `url` が必要で、`target` と再帰的な `children` は任意です。デモメニューをテーマの menu location に表示する場合は、`menuLocations` で宣言した key と一致させます。

`demo.settings` の key は `settingsSchema` にも定義してください。Seed 時にはこれらの値が有効なテーマの現在の設定へ merge され、関係のない設定は保持されます。

## Reseed の動作を理解する

**Reseed demo** は、同じテーマが以前に作成したコンテンツとメニューだけを置き換えます。通常のサイトコンテンツと、別のテーマが所有するデモ行には影響しません。既存のコンテンツタイプは保持され、デモ設定は再度 merge されます。

編集者が seed 済みの行を変更している可能性があるため、reseed はそのテーマのデモコンテンツに対する破壊的操作として扱ってください。デモエントリーを実際のコンテンツへ編集し始めた後に reseed するよう案内しないでください。

:::note[seed は必ず管理者の手動操作です]
テーマのインストールや更新だけでは、デモコンテンツは自動的に seed も reseed もされません。デモデータを変更した新しいバージョン（翻訳の修正、ページの追加、メニューの追加など）を公開しても、以前のバージョンを seed 済みのサイトは、管理者が **Appearance** を開いて有効なテーマに対して **Reseed demo** をクリックするまで、既存のデモコンテンツのままです。新規インストールでは、管理者が **Seed demo** をクリックするまでデモコンテンツは表示されません。変更を反映するには reseed が必要であることを、変更履歴に明記してください。
:::

## パッケージ化前にテストする

1. 空のテストサイトでテーマを有効にし、**Seed demo** を実行する。
2. Route、block、menu、設定、SEO、すべての locale を確認する。
3. Demo ではない通常のエントリーを編集し、reseed 後も変更されないことを確認する。
4. Seed 済みエントリーを編集して reseed し、置換動作が明確に説明されていることを確認する。
5. デモデータのないサイトでもテーマをテストし、empty state を確認する。
6. テーマを build、package 化して clean site にインストールし、seed test を繰り返す。
