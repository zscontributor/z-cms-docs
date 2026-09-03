---
title: 最初のプラグインを作る
description: Z-CMS プラグインの基本構造とライフサイクルを説明します。
sidebar:
  order: 1
---

プラグインは、V8 の隔離環境（V8 isolate）で実行されます。リソースにアクセスするには、マニフェストで権限を宣言し、Administrator の承認を受けたうえで、実行時に CMS ゲートウェイの検証を通過する必要があります。

## 事前準備

Node.js 22+、pnpm 10+ と `zcms` CLI を用意します。

```bash
npm install -g @zcmsorg/cli@latest
```

## ステップ 1: プロジェクトのひな型を作成する

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
```

管理しているドメインを逆順にした形式（reverse-DNS）の ID を使ってください。未指定の項目は `init` が対話形式で確認します。ファイルがすでにあるディレクトリには書き込みません。

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

`changelog` には、そのバージョンの変更点を簡潔に記載します。管理者はプラグインの **変更点** で内容を確認してから更新を承認できます。プレーンテキストで一行に一つの変更を書き、2000 文字以内に収めてください。空行とタブも使用できます。`version` を上げるたびに更新します。

`scope` はプラグインの**有効化の範囲**を宣言し、`"site"`（既定）または `"org"` を指定します。

- `"site"` — サイトごとにインストールして有効化します。既定値であり、ほとんどのプラグイン（SEO、コマース、AI アシスタントなど）に適しています。
- `"org"` — **組織（テナント）に対して一度だけ**インストールし、その組織が所有する**すべてのサイト**で実行します。WordPress の「ネットワーク有効化」プラグインに相当します。管理者は専用の**組織のプラグイン**画面で管理します。

`scope` は動作範囲を決めるもので、権限を追加するものではありません。`"org"` のプラグインも組織単位で権限の承認が必要で、コアプラグインになるわけではありません。この値は署名済みマニフェストから読み取るため、パッケージが勝手に権限を拡大することはできません。管理画面での操作は [テーマとプラグイン](/ja/users/extensions/) を参照してください。

## ステップ 3: エントリーポイントを実装する

`@zcmsorg/plugin-sdk` の型と API を使ってエントリーポイントを実装します。

- SDK が提供する API だけを使います。
- コンテンツ、メディア、メールには SDK のゲートウェイ経由でアクセスします。
- 任意の権限が承認されなかった場合も安全に処理します。
- 秘密情報はプラットフォームの専用ストアに保存し、パッケージに含めません。
- ランタイムの仕様にないデータベースライブラリ、ファイルシステム API、Node.js 組み込みモジュールはインポートしません。

## ステップ 4: ローカルで実行する

プラグインをビルドし、Z-CMS の開発環境を起動します。作成したパッケージをテスト環境にインストールし、プラグインの動作範囲に合わせて有効化してください。

次の項目を順番に確認してください。

1. 実行時エラーやスキーマエラーがなく、プラグインを読み込める。
2. 各機能が、ドキュメントに記載した最小限の権限で動作する。
3. 権限が拒否された場合も安全に処理できる。
4. 無効化すると、フックとバックグラウンドジョブが適切に停止する。
5. 再び有効化しても、ジョブ、Webhook、設定が重複しない。

## ステップ 5: 信頼境界をテストする

プラグインの有効化・無効化、権限チェック、不正な入力を対象に、自動テストを追加します。別テナントへのアクセス、未承認の権限の使用、SDK の仕様にない API 呼び出しが拒否されることも確認してください。

プロジェクトの型チェック、lint、テストを実行し、すべての失敗を修正してからパッケージを作成します。

## ステップ 6: リリース用パッケージを作成する

1. バージョンの管理は、下記の項目 5 で使う `zcms pack` に任せます。現在のバージョンをパッケージ化した後、マニフェストと `package.json` を次のバージョンに更新します。特定のバージョンを指定する場合は `--set-version` を使います。
2. マニフェストの `changelog` と権限の説明を更新します。
3. コミット済みのロックファイルを使い、未コミットの変更がないソースからビルドします。
4. 公開者の鍵ペアがなければ、一度だけ生成します。

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

`zcms pack` は `src`、`node_modules`、`.git`、`.env`、ソースマップ、ビルド設定を除外します。ファイルの順序をそろえ、アーカイブ内のタイムスタンプを 0 にすることで、同じ入力から同一のパッケージを生成できます。再現性を確認するときは、比較する最初の実行から毎回 `--no-bump` を指定し、バージョンを変えないでください。

この段階では `publisher signature : VALID` と表示されることを確認します。`marketplace signature : not checked` は、まだ Marketplace が署名していないため正常です。

## ステップ 7: パッケージを提出する

公開者の確認、Marketplace への提出、審査、署名、公開の手順は、[パッケージを公開する](/ja/marketplace/publishing/)を参照してください。
