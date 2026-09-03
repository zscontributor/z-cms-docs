---
title: 最初のテーマを作る
description: Z-CMS Theme SDK を使ってテーマを作成します。
sidebar:
  order: 1
---

テーマは、`site-runtime` に渡されたデータをどのように画面へ表示するかを定義します。利用できる SDK は `@zcmsorg/theme-sdk` です。API やデータベースに直接アクセスすることはできません。

## 事前準備

Node.js 22+、pnpm 10+ と `zcms` CLI を用意します。

```bash
npm install -g @zcmsorg/cli@latest
```

## ステップ 1: プロジェクトのひな型を作成する

```bash
zcms init ./corporate --kind theme --id com.acme.theme.corporate
```

管理しているドメインを逆順にした形式（reverse-DNS）の ID を使ってください。未指定の項目は `init` が対話形式で確認します。ファイルがすでにあるディレクトリには書き込みません。

生成されたテーマには、ビルド、型チェック、パッケージ化、署名に必要な設定が含まれています。

```text
corporate/
├── theme.json           # manifest
├── package.json
├── build.mjs            # esbuild -> dist/index.mjs + dist/theme.css
├── tsconfig.json
├── src/
│   ├── index.tsx        # Layout、template、block、SEO
│   ├── theme.css
│   └── locales/en.json
└── .gitignore           # *.pem を ignore 済み — 署名鍵はここに置かれます
```

```bash
cd corporate
pnpm install
pnpm build
```

:::caution[エントリーポイントは `.mjs`、React は external]
`site-runtime` はテーマを `file://` URL で読み込むため、エントリーポイントは ES module の **`dist/index.mjs`** でなければなりません。形式を誤るとテーマを読み込めず、既定のテーマへ切り替わります。

`react` と `react/jsx-runtime` は **external** に指定し、テーマの出力ファイルに含めないでください。ホストと同じ React インスタンスを使うための設定です。React を重複して読み込むと、リリース版の実行時に "invalid hook call" が発生することがあります。

`build.mjs` は両方とも正しく設定済みです。変更する前に、ファイル内のコメントを確認してください。
:::

このページの残りでは、生成されたファイルの内容を説明します。

## ステップ 2: テーマの機能を宣言する

パッケージルートに `theme.json` を作成します。必須フィールドは `id`、`name`、`version`、`author`、`engine`、`templates`、`menuLocations`、`settingsSchema` です。テーマの `entry` は `dist/index.mjs` である必要があります。`styles` はテーマに含めるスタイルシートを指定します。

```json
{
  "id": "com.example.theme.corporate",
  "name": "Corporate",
  "version": "0.1.0",
  "description": "Responsive corporate theme.",
  "changelog": "- First public release.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.mjs",
  "styles": "dist/theme.css",
  "templates": ["home", "page", "post", "archive", "notFound", "error"],
  "menuLocations": [
    { "key": "primary", "name": "Primary menu" },
    { "key": "footer", "name": "Footer menu" }
  ],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "primaryColor": {
        "type": "string",
        "title": "Primary colour",
        "format": "color",
        "default": ""
      }
    }
  },
  "media": {
    "screenshots": ["screenshots/home.png"]
  }
}
```

任意フィールドは `changelog`、`seo`、`media`、`demo`、`optionalCapabilities` です。更新後もサイトから参照できるよう、テンプレート名、メニューキー、設定キーはバージョン間で変更しないでください。

`changelog` には、そのバージョンの変更点を簡潔に記載します。管理者はテーマの **変更点** で内容を確認してから更新できます。プレーンテキストで一行に一つの変更を書き、2000 文字以内に収めてください。空行とタブも使用できます。リリース済みの各バージョンに記録が残るため、`version` を上げるたびに更新します。

## ステップ 3: テンプレートとブロックを実装する

`@zcmsorg/theme-sdk` の型を使い、ホーム、コンテンツページ、記事、一覧、エラー表示、代替表示のテンプレートを実装します。テーマがページや記事を直接取得するわけではありません。`site-runtime` が URL に一致する項目を `content`、一覧を `archive`、サイト共通のデータを `ctx` として渡します。

まず[ページとブログ記事を表示する](/ja/developers/theme-handbook/rendering-content/)で、`content.data`、`content.blocks`、ページネーション、メニュー、多言語 URL の実装例を確認してください。テーマにサンプルデータを含める場合は、[サンプルデータを提供する](/ja/developers/theme-handbook/demo-content/)を参照してください。テーマがプラグインの任意機能に対応する場合は、[テーマとプラグインを連携する](/ja/developers/theme-handbook/plugin-integration/)へ進みます。

1. `site-runtime` から渡されたデータだけを表示します。
2. 信頼できないコンテンツは、表示する箇所に応じて適切にエスケープします。
3. 見出しの階層、キーボード操作、フォーカスの表示を整え、アクセシビリティを確保します。
4. 狭い画面でも広い画面でも使いやすいレイアウトにします。
5. 任意のコンテンツ、画像、メニューがない場合も、安全な代替表示を用意します。

## ステップ 4: 設定項目を定義する

テーマの設定項目は JSON Schema で定義します。Admin はこのスキーマから設定フォームを生成するため、`admin-web` を変更せずにテーマ固有の設定を追加できます。

設定の後方互換性を維持してください。新しいフィールドには既定値を設定し、既存フィールドの意味を予告なく変更せず、必要な移行手順を文書化します。

## ステップ 5: アセットと翻訳を追加する

- 使用するアセットだけをパッケージに含めます。
- 画像とフォントはパッケージ化の前に最適化します。
- 画面の文言をコードに直接埋め込まず、翻訳キーを使います。
- すべての翻訳キーに既定の文言を用意します。
- ユーザーのコンテンツとテーマの画面文言を分けて管理します。

## ステップ 6: ローカルでプレビューする

テーマをビルドし、ローカルの開発ビルドをテストサイトへ読み込みます。少なくとも次の項目をプレビューしてください。

1. ホーム、一覧、詳細、404 ページ。
2. データがない場合、最小限の場合、長い文章を含む場合。
3. 対応するすべての言語。
4. パソコンとモバイル端末のレイアウト。
5. 対応している場合は、明るい背景と暗い背景でのロゴなどの表示。
6. メタデータ、Open Graph、robots の指定、JSON-LD の出力。

別のテーマに切り替えてから再度有効化し、コンテンツや設定が削除されないことを確認します。

## ステップ 7: テストとパッケージ作成

型チェック、lint、ユニットテスト、アクセシビリティチェック、ビジュアルリグレッションテストを実行します。その後、次の手順でリリース用ファイルを作成します。

1. マニフェストの `changelog` を更新します。`version` は、下記の項目 4 で使う `zcms pack` がパッケージ化後に自動で更新します。特定のバージョンを指定する場合は `--set-version` を使います。
2. コミット済みのロックファイルを使い、未コミットの変更がないソースからビルドします。
3. 公開者の鍵ペアがなければ、一度だけ生成します。

   ```bash
   zcms keygen --out ./keys
   ```

4. 出力先ディレクトリを作成し、プロジェクトルートを直接パッケージ化する。CLI はソース、依存関係、開発用設定を自動的に除外します。

   ```bash
   mkdir -p release

   zcms pack . --kind theme \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/corporate-0.1.0.zcms
   ```

5. 公開者の署名を検証する。

   ```bash
   zcms verify ./release/corporate-0.1.0.zcms
   ```

6. `zcms pack` が出力した checksum を記録する。

この段階では `publisher signature : VALID` と表示されることを確認します。Marketplace はアップロード後に静的スキャンを実行し、審査の過程で 2 つ目の署名を追加します。続きは[パッケージを公開する](/ja/marketplace/publishing/)を参照してください。
