---
title: 開発を始める
description: Z-CMS のローカル開発環境をセットアップする手順です。
sidebar:
  order: 1
---

Z-CMS のコードは TypeScript で記述され、一つのリポジトリ（モノレポ）で管理されています。Node.js、pnpm、Next.js、NestJS、PostgreSQL、Redis を使用します。

## 必要な環境

- Node.js 22+
- pnpm 10+
- Docker

## ローカルで起動する

```bash
cp .env.example .env
pnpm install
pnpm bootstrap
pnpm dev
```

変更を提出する前に、次のコマンドを実行してください。

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
```

`pnpm verify` では、テナント間のデータ分離、サンドボックス外へのアクセスの防止、パッケージ署名の検証など、重要なセキュリティ要件を確認します。

## 拡張機能を開発する

プラグインやテーマを作るために、このリポジトリをチェックアウトする必要はありません。CLI をインストールして、プロジェクトのひな型を作成します。

```bash
npm install -g @zcmsorg/cli@latest
zcms init
```

`init` でプラグインかテーマかを選ぶと、ビルド、型チェック、テスト、パッケージ化、署名に必要な設定を含むプロジェクトが生成されます。実際のサイトで実行する際に必要な出力形式も、あらかじめ設定されています。

続いて、開発する内容に合うガイドを参照してください。

- [プラグインを作成する](/ja/developers/plugin-handbook/getting-started/)
- [テーマを作成する](/ja/developers/theme-handbook/getting-started/)
- [`zcms` でひな型作成、パッケージ化、検証を行う](/ja/developers/cli/)
- [パッケージを Marketplace の審査へ提出する](/ja/marketplace/publishing/)
