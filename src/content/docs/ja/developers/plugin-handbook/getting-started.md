---
title: 最初のプラグインを作る
description: Z-CMS プラグインの基本構造とライフサイクルを説明します。
sidebar:
  order: 1
---

プラグインは V8 isolate 内で実行されます。利用できる機能は、マニフェストで宣言され、Administrator に承認され、CMS ゲートウェイで検証されたものだけです。

## 事前準備

Node.js 22+、pnpm 10+ と `zcms` CLI を用意します。

```bash
npm install -g @zcmsorg/cli@latest
```

## ステップ 1: プロジェクトのひな型を作成する

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
```

自分が管理するドメインの reverse-DNS ID を使用してください。指定しなかった項目は `init` が対話形式で尋ねます。既存のファイルがあるディレクトリには書き込みません。

生成されたプロジェクトには、ビルド、型チェック、テスト、パッケージ化、署名に必要な設定が含まれています。

```text
hello/
├── plugin.json          # manifest
├── package.json
├── build.mjs            # esbuild -> 単一の CommonJS file
├── tsconfig.json
├── src/index.ts
├── test/plugin.test.ts
└── .gitignore           # *.pem を ignore 済み — 署名鍵はここに置かれます
```

```bash
cd hello
pnpm install
pnpm build
pnpm test
```

:::caution[単一の CommonJS ファイルにビルドすること]
サンドボックスは **単一の CommonJS スクリプト** を評価し、`@zcmsorg/plugin-sdk` だけを提供します。モジュールリゾルバーがないため、出力が複数ファイルに分かれると相対 `require()` を解決できず、有効化時にエラーになります。

`build.mjs` はソースを 1 ファイルにまとめるよう設定済みです。ソース自体は複数ファイルに分割して構いませんが、`format: "cjs"` と SDK の external 指定は変更しないでください。
:::

このページの残りでは、生成されたファイルの内容を説明します。

## ステップ 2: マニフェストを完成させる

パッケージルートに `plugin.json` を作成します。必須フィールドは `id`、`name`、`version`、`author`、`engine` です。`entry` の既定値は `dist/index.js` で、`permissions` には有効化時に要求するスコープを指定します。

```json
{
  "id": "com.example.plugin.hello",
  "name": "Hello Plugin",
  "version": "0.1.0",
  "description": "Adds a read-only content helper.",
  "changelog": "- First public release.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.js",
  "scope": "site",
  "permissions": ["content:read"],
  "capabilities": ["hello.content-helper"],
  "media": {
    "screenshots": ["screenshots/admin.png"]
  }
}
```

任意フィールドは `changelog`、`scope`、`capabilities`、`media`、`settingsSchema`、`database.tables` です。通常は `ctx.storage` を使用し、リレーショナルテーブルが本当に必要な場合だけ `database.tables` を宣言してください。すべてのテーブル名には、プラットフォームが指定するプラグイン固有の接頭辞が必要です。

任意の `changelog` フィールドには、このバージョンのリリースノート（前バージョンからの変更点を簡潔にまとめたもの）を記述します。管理者はプラグイン管理画面で「変更点」ノートとして、また更新をレビューする際に確認でき、承認する前に新しいバージョンが何をするかを理解できます。プレーンテキストで 1 行に 1 つの変更を書き（空行とタブは使用可能）、上限は 2000 文字です。`version` を上げるたびに `changelog` を更新してください。

`scope` はプラグインの**有効化の範囲**を宣言し、`"site"`（既定）または `"org"` を指定します。

- `"site"` — サイトごとにインストールして有効化します。既定値であり、ほとんどのプラグイン（SEO、コマース、AI アシスタントなど）に適しています。
- `"org"` — **組織（テナント）に対して一度だけ**インストールし、その組織が所有する**すべてのサイト**で実行します。WordPress の「ネットワーク有効化」プラグインに相当します。管理者は専用の**組織のプラグイン**画面で管理します。

`scope` は*権限*ではなく*範囲*です。`"org"` プラグインもインストールする階層で権限の承認を受け、コアプラグインになることはありません。プラットフォームは**署名済み**マニフェストから `scope` を読み取るため、パッケージがこのフィールドで自身の権限を拡大することはできません。各階層で管理者がプラグインを有効化する方法は[テーマとプラグイン](/ja/users/extensions/)を参照してください。

## ステップ 3: エントリーポイントを実装する

`@zcmsorg/plugin-sdk` の型と API を使ってエントリーポイントを実装します。

- SDK が expose している API だけを使用します。
- Content、media、mail には SDK の gateway 経由でアクセスします。
- 任意の権限が承認されなかった場合も適切に処理します。
- シークレットはプラットフォームのシークレットストアに保存し、パッケージには含めません。
- ランタイム仕様に含まれないデータベースパッケージ、ファイルシステム API、Node.js 組み込みモジュールはインポートしません。

## ステップ 4: ローカルで実行する

プラグインをビルドして Z-CMS の開発環境を起動します。ローカルビルドをテストサイトへインストールし、そのサイトだけで有効化します。

次の項目を順番に確認してください。

1. ランタイムエラーやスキーマエラーがなく、プラグインを読み込める。
2. 各機能がドキュメントに記載された最小限の権限で動作する。
3. Permission が拒否された場合に安全に処理される。
4. Deactivate すると hook と background job が正しく停止する。
5. 再度 activate しても job、webhook、設定が重複しない。

## ステップ 5: 信頼境界をテストする

プラグインのライフサイクル、権限確認、不正な入力に対する自動テストを追加します。別テナントへのアクセス、未承認の権限の使用、SDK 仕様外の API 呼び出しを試す否定テストも含めてください。

プロジェクトの型チェック、lint、テストを実行し、すべての失敗を修正してからパッケージを作成します。

## ステップ 6: リリース用パッケージを作成する

1. バージョンは `zcms pack`（ステップ 5）に任せます。現在のバージョンを刻印してから進め、マニフェストと `package.json` を同期させます。正確なバージョンに固定したい場合は `--set-version` を渡します。
2. マニフェストの `changelog` ノートと権限に関する説明を更新します。
3. コミット済みのロックファイルを使い、クリーンなチェックアウトからビルドします。
4. 公開者の鍵ペアがない場合は、一度だけ生成します。

   ```bash
   zcms keygen --out ./keys
   ```

5. 出力先ディレクトリを作成し、プロジェクトルートを直接パッケージ化します。CLI はソース、依存関係、開発用設定を自動的に除外します。

   ```bash
   mkdir -p release

   zcms pack . --kind plugin \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/hello-plugin-0.1.0.zcms
   ```

6. 公開者の署名を検証します。

   ```bash
   zcms verify ./release/hello-plugin-0.1.0.zcms
   ```

7. `zcms pack` が出力した checksum を記録します。

`zcms pack` は `src`、`node_modules`、`.git`、`.env`、ソースマップ、ビルドツールの設定を除外します。ファイルを並べ替え、アーカイブのタイムスタンプを 0 にするため、同じビルド済みディレクトリから同一のパッケージを生成できます。これを確認するために再パッケージ化するときは `--no-bump` を付けて、実行間でバージョンが進まないようにしてください。

この段階では `publisher signature : VALID` と表示されることを確認します。`marketplace signature : not checked` は、まだ Marketplace が署名していないため正常です。

## ステップ 7: パッケージを提出する

公開者の確認、Marketplace への提出、審査、署名、公開の手順は、[パッケージを公開する](/ja/marketplace/publishing/)を参照してください。
