---
title: 最初のテーマを作る
description: Z-CMS Theme SDK を使ってテーマを作成します。
sidebar:
  order: 1
---

テーマは、`site-runtime` が Web サイトをレンダリングする方法を定義します。テーマが依存できるのは `@zcmsorg/theme-sdk` だけです。API やデータベースへ直接アクセスすることはできません。

## 事前準備

Node.js 22+、pnpm 10+ と `zcms` CLI を用意します。

```bash
npm install -g @zcmsorg/cli@latest
```

## ステップ 1: プロジェクトのひな型を作成する

```bash
zcms init ./corporate --kind theme --id com.acme.theme.corporate
```

自分が管理するドメインの reverse-DNS ID を使用してください。指定しなかった項目は `init` が対話形式で尋ねます。既存のファイルがあるディレクトリには書き込みません。

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

`react` と `react/jsx-runtime` は **external** のままにしてください。これにより、コンポーネントはホストと同じ React インスタンスを使います。React をテーマへ同梱すると二重に読み込まれ、本番環境で "invalid hook call" が発生します。

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

任意の `changelog` フィールドには、このバージョンのリリースノート（前バージョンからの変更点を簡潔にまとめたもの）を記述します。管理者はテーマ管理画面で「変更点」ノートとして確認でき、更新を適用する前に何が変わるかを把握できます。プレーンテキストで 1 行に 1 つの変更を書き（空行とタブは使用可能）、上限は 2000 文字です。公開された各バージョンは自身のノートを保持するため、`version` を上げるたびに `changelog` を更新してください。

## ステップ 3: テンプレートとブロックを実装する

`@zcmsorg/theme-sdk` の型を使って、ホーム、ページ、記事、一覧、エラー、フォールバックの各テンプレートを実装します。テーマ自身が Pages や Blogs を取得するのではありません。`site-runtime` が URL に一致する項目を `content`、一覧を `archive`、サイト共通データを `ctx` として渡します。

まず[ページとブログ記事を表示する](/ja/developers/theme-handbook/rendering-content/)で、`content.data`、`content.blocks`、ページネーション、メニュー、多言語 URL の実装例を確認してください。テーマにサンプルデータを含める場合は、[デモコンテンツを提供する](/ja/developers/theme-handbook/demo-content/)を参照してください。テーマがプラグインの任意機能に対応する場合は、[テーマとプラグインを連携する](/ja/developers/theme-handbook/plugin-integration/)へ進みます。

1. `site-runtime` から渡されたデータだけをレンダリングする。
2. 信頼できないコンテンツをフィールドの型に応じてエスケープする。
3. 適切な heading structure、keyboard navigation、focus state を用意する。
4. 狭い viewport と広い viewport の responsive behavior を定義する。
5. 任意のコンテンツ、メディア、メニューがない場合に安全な代替表示を用意する。

## ステップ 4: 設定項目を定義する

テーマの設定項目は JSON Schema で定義します。Admin はこのスキーマから設定フォームを生成するため、`admin-web` を変更せずにテーマ固有の設定を追加できます。

設定の後方互換性を維持してください。新しいフィールドには既定値を設定し、既存フィールドの意味を予告なく変更せず、必要な移行手順を文書化します。

## ステップ 5: アセットと翻訳を追加する

- テーマが使用するアセットだけをパッケージに含める。
- Package 作成前に画像と font を最適化する。
- UI の文言をハードコードせず翻訳キーを使用する。
- すべてのキーに既定のメッセージを用意する。
- ユーザーコンテンツとテーマの翻訳メッセージを分離する。

## ステップ 6: ローカルでプレビューする

テーマをビルドし、ローカルの開発ビルドをテストサイトへ読み込みます。少なくとも次の項目をプレビューしてください。

1. ホーム、一覧、詳細、404 ページ。
2. 空の状態、最小限のコンテンツ、長いコンテンツ。
3. 対応するすべての locale。
4. Desktop と mobile layout。
5. 対応している場合は、明るい背景と暗い背景でのブランドアセット。
6. Metadata、Open Graph、robots policy、JSON-LD output。

別のテーマに切り替えてから再度有効化し、コンテンツや設定が削除されないことを確認します。

## ステップ 7: テストとパッケージ作成

型チェック、lint、ユニットテスト、アクセシビリティチェック、ビジュアルリグレッションテストを実行します。その後、次の手順でリリース用ファイルを作成します。

1. マニフェストの `changelog` ノートを更新する。`version` はそのままにしておく。`zcms pack`（ステップ 4）がバージョンを刻印し、マニフェストを自動で進める。特定のバージョンが必要な場合は `--set-version` を渡す。
2. Commit 済み lockfile を使い、clean checkout から build する。
3. Publisher key pair がない場合は、一度だけ生成する。

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
