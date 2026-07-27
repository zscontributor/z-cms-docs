---
title: zcms CLI リファレンス
description: Z-CMS のテーマやプラグインを作成し、パッケージ化して署名します。
sidebar:
  order: 4
---

`zcms` は、拡張機能のひな型作成、公開者鍵の生成、パッケージ化、署名の検証を行う CLI です。コマンドは `init`、`keygen`、`pack`、`verify` の 4 つに加えて `help` があります。パッケージのアップロードは Developer Portal で行います。

## インストール

```bash
npm install -g @zcmsorg/cli@latest
```

パッケージ名は `@zcmsorg/cli`、インストールされるコマンドは `zcms` です。Node.js 22 以上が必要です。

引数を付けずに `zcms` を実行すると、インストールを確認でき、利用可能なコマンドが表示されます。

## コマンド一覧

```text
zcms init [<dir>] [--kind theme|plugin] [--id <reverse.dns.id>] [--name <name>]
          [--description <text>] [--author <name>] [--author-url <url>]
          [--version <semver>] [--yes]
zcms keygen [--out <dir>]
zcms pack <dir> --kind theme|plugin --key <private.pem> --pub <public.pem>
          [--bump patch|minor|major] [--no-bump] [--set-version <semver>]
          [--operator-key <private.pem>] [--out <file>]
zcms verify [<file.zcms>] [--marketplace-key <public.pem>]
zcms help [--lang en|ja|vi]
```

コマンドを指定せずに `zcms` を実行すると、この使用方法が表示されます。

### ヘルプと言語

`zcms help` は上記の使用方法を表示します。コマンドなしの `zcms`、`zcms -h`、`zcms -help`、`zcms --help` も同様です。ヘルプは英語・日本語・ベトナム語で利用できます。

```bash
zcms help --lang ja      # 日本語
zcms help --lang vi      # Tiếng Việt  (--lang JP や --lang VN も受け付けます)
```

`--lang` がない場合、言語は `ZCMS_LANG`、次にシェルのロケール（`LANG`）から判定され、いずれもなければ英語になります。翻訳されるのはヘルプのみで、ビルド出力・チェックサム・エラーの詳細はどの言語でも同じです。

## 1. プロジェクトのひな型を作成する

```bash
zcms init
```

ターミナルで `init` を実行すると、不足している情報を順に質問し、マニフェスト、ソース、ビルドスクリプト、テストを含むプロジェクトを作成します。既存のファイルがあるディレクトリには書き込みません。

CLI からの質問なしで作成するには、`--yes` と必要なオプションを指定します。スクリプトや CI で実行する場合に利用できます。

```bash
zcms init ./hello --yes --kind plugin \
  --id com.acme.plugin.hello \
  --name "Hello" \
  --description "Adds a content helper." \
  --author "Acme" \
  --author-url "https://acme.example"
```

`--yes` を使う場合や対話できない CI 環境では、`--kind` と `--id` が必須です。ほかのオプションを省略すると既定値が使われ、バージョンは `0.1.0` になります。

Plugin は次の構成で生成されます。

```text
hello/
├── plugin.json          # manifest — identity、permission、settings form
├── package.json
├── build.mjs            # esbuild -> 単一の CommonJS file
├── tsconfig.json
├── src/index.ts         # filter、action、job、setup
├── test/plugin.test.ts
├── README.md
└── .gitignore           # *.pem を ignore 済み — 下記参照
```

Theme も同じ構成で、`theme.json`、`src/index.tsx`（Layout、template、block）、`src/theme.css` を含みます。

### ひな型が重要な理由

次の 2 つの要件はビルド時ではなく、拡張機能を実際のサイトで実行したときに検証されます。設定を誤ってもビルド、テスト、パッケージ化、署名、インストールまでは成功し、有効化した時点で初めてエラーになる場合があります。`init` が作成するプロジェクトは、最初から両方の要件を満たしています。

| | 要件 | 誤ったときに何が起きるか |
| --- | --- | --- |
| **プラグイン** | **単一の CommonJS ファイル**。V8 isolate のサンドボックスが提供するモジュールは `@zcmsorg/plugin-sdk` だけです。 | モジュールリゾルバーがないため、複数の出力ファイルに分かれると相対 `require()` を解決できず、有効化時にエラーになります。`build.mjs` はソースを 1 ファイルにまとめるよう設定済みです。 |
| **テーマ** | エントリーポイントは **ESM** の **`.mjs`** ファイル。React は **external** にします。 | 形式を誤ると `site-runtime` はテーマを読み込めず、既定のテーマへ切り替わります。React を同梱するとホスト側と二重になり、本番環境で "invalid hook call" が発生します。 |

### 開発サイクル

```bash
cd hello
pnpm install
pnpm build       # plugin -> dist/index.js   theme -> dist/index.mjs + dist/theme.css
pnpm typecheck
pnpm test
```

## 2. 公開者の鍵ペアを生成する

```bash
zcms keygen --out ./keys
```

`./keys` に次の 2 ファイルが作成されます。

- `publisher-private.pem`: 所有者だけが読み取り可能な秘密鍵 (`0600`)
- `publisher-public.pem`: Developer Portal へ登録する公開鍵

鍵ペアは公開者ごとに一度だけ作成し、バージョンごとに作り直さないでください。CLI は既存の鍵ファイルを秘密鍵・公開鍵のいずれも上書きしません。秘密鍵を上書きすると、それで署名したすべてのパッケージが検証できなくなり、公開鍵だけを書き換えると鍵ペアが一致しなくなります。`--out` は空のディレクトリを指定してください。

`publisher-private.pem` は公開者の身元を証明する秘密鍵です。漏洩すると、第三者があなたの名前でパッケージに署名できます。Git 以外の安全な場所にバックアップし、チャットや CI ログへ貼り付けないでください。

## 3. パッケージディレクトリを準備する

マニフェストは、パッケージ化するディレクトリのルートに置きます。

- `--kind plugin` の場合は `plugin.json`
- `--kind theme` の場合は `theme.json`

マニフェストには `id`、`name`、`version`、`author`、`engine` が必要です。`entry` はビルド済みファイルを指し、パッケージ化する前に存在している必要があります。プラグインは `dist/index.js`、テーマは `dist/index.mjs` です。

`zcms init` で作成したプロジェクトは、`pnpm build` の後にプロジェクトルートから `zcms pack .` を実行できます。CLI は開発時にしか使わないファイルを自動的に除外します。

- **Key material**: `*.pem`、`*.key`、`*.p12`、`*.pfx`、`*.keystore`、`id_*`、`.npmrc`
- **Secret と VCS**: `.env*`、`.git`、`node_modules`
- **開発専用**: `src`、`test/`、build script、`tsconfig*.json`、tool config、source map

`*.pem` は常に除外されるため、`./keys` ディレクトリが `.zcms` ファイルに含まれることはありません。それでも、秘密鍵は Git の外で管理し、チャットや CI ログへ出力しないでください。

## 4. 拡張機能をパッケージ化して署名する

最初の引数は **パッケージ化する theme または plugin へのパス** です。`pack` はそのディレクトリ 1 つをアーカイブして署名します。ディレクトリ内にいる場合は `.`、そうでなければパスを明示的に指定します。

```bash
mkdir -p release

# plugin をパスで指定
zcms pack ./plugins/seo-toolkit --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/seo-toolkit-1.0.0.zcms

# theme をパスで指定
zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/corporate-1.0.0.zcms
```

`--kind` はそのパスのマニフェストと一致させます（`plugin.json` → `--kind plugin`、`theme.json` → `--kind theme`）。`--out` を省略すると、現在のディレクトリに `<manifest.id>-<manifest.version>.zcms` が作成されます。`--out` を指定する場合、親ディレクトリは事前に作成してください。sign・pack・提出の全体的な流れは [パッケージを公開する](/ja/marketplace/publishing/) を参照してください。

コマンドはパッケージ ID、バージョン、ファイルサイズ、チェックサムを出力します。この時点では公開者の署名だけがあり、Marketplace の審査と署名が完了するまではインストールできません。

### バージョンは自動で上がる

リリースの合間にバージョンを手で編集する必要はありません。`pack` は現在マニフェストが宣言しているバージョンでパッケージ化し、その後そのバージョンを進めて `theme.json`/`plugin.json` に書き戻します。`package.json` があればそちらにも書き込むため、2 つがずれることはありません。したがって、ひな型で作成したばかりの `0.1.0` は `0.1.0` **として** パッケージ化され、マニフェストは次のパッケージ化に備えて `0.1.1` に更新されます。

```bash
zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem --pub ./keys/publisher-public.pem
# version : packed 1.0.0; theme.json advanced to 1.0.1 for the next pack
```

既定の動作は 3 つのフラグで上書きできます。

| Flag | Effect |
| --- | --- |
| *(none)* | 現在のバージョンでパッケージ化し、その後 **patch** 番号を進める |
| `--bump minor` / `--bump major` | patch ではなく minor または major 番号を進める |
| `--set-version <semver>` | 指定したバージョンでパッケージ化する（`--no-bump` も併用しない限り、その後もバージョンを進める） |
| `--no-bump` | 現在のバージョンでパッケージ化し、マニフェストは変更しない |

出力名 `<manifest.id>-<manifest.version>.zcms` には、進めた後ではなく *実際にパッケージ化した* バージョンが使われます。パッケージ化に失敗した場合はバージョンがロールバックされます。失敗したパッケージ化が中途半端にバージョンを進めたまま残ることはありません。

### サイドロード署名（セルフホスト専用）

Marketplace で公開する場合は読み飛ばして構いません。**自分の** Z-CMS インスタンスを運用していて、Marketplace を経由せずに拡張機能をインストールしたい場合は、`--operator-key` を追加します。

```bash
zcms pack . --kind theme \
  --key ./op-private.pem --pub ./op-public.pem \
  --operator-key ./op-private.pem
```

これは 2 つ目の **operator** 署名を付与します。対応する `OPERATOR_PUBLIC_KEY` をランタイムがピン留めし、テーマの場合は `ALLOW_THEME_SIDELOAD=true` を設定したインスタンスなら、管理者が **管理画面 → Appearance → Install from file** からアップロードして承認した時点で、Marketplace を介さずにパッケージを実行します。`--key`/`--pub` には同じ operator の鍵ペアを使います。この方法で署名したパッケージはサイドロード用であり、Marketplace への提出用ではありません。

## 5. 提出前に検証する

```bash
zcms verify ./release/example-plugin-1.0.0.zcms
```

ファイルを指定せずに実行すると、`zcms verify` はカレントディレクトリで最も新しい `.zcms` を選びます。パッケージ化したファイル名はバージョンが上がるたびに変わるため、いちいち入力する必要がほとんどなく便利です。

この段階では `--marketplace-key` を指定しません。`publisher signature : VALID` と表示されれば、内容のチェックサムと公開者の署名は有効です。`marketplace signature : not checked` は、まだ Marketplace へ提出していないため正常な表示です。

## 6. Marketplace のパッケージを検証する

承認済みパッケージをダウンロードした後は、Marketplace の公式公開鍵を使って両方の署名を検証します。

```bash
zcms verify ./downloaded-package.zcms \
  --marketplace-key ./marketplace-public.pem
```

`marketplace-public.pem` は Marketplace の公開鍵であり、`zcms keygen` が生成する `publisher-public.pem` とは異なります。両方の署名が `VALID` なら、パッケージをインストールできます。

## 7. 審査用にアップロードする

CLI に `zcms publish` コマンドはありません。検証した `.zcms` ファイルを [**Developer Portal → Submit a package**](https://marketplace.z-cms.org/developer/submit) からアップロードしてください。検証後にビルドやパッケージ化をやり直さず、検証したファイルそのものを提出します。

審査の全手順は [パッケージを公開する](/ja/marketplace/publishing/) を参照してください。
