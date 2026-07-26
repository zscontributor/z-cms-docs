---
title: 開発を始める
description: Z-CMS のローカル開発環境をセットアップする手順です。
sidebar:
  order: 1
---

Z-CMS は、Node.js、pnpm、Next.js、NestJS、PostgreSQL、Redis で構成された TypeScript モノレポです。

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

`pnpm verify` はテナント分離、サンドボックスからの脱出、パッケージ署名など、重要なセキュリティ要件を検証します。

## 拡張機能を開発する

プラグインやテーマを作るために、このリポジトリをチェックアウトする必要はありません。CLI をインストールして、プロジェクトのひな型を作成します。

```bash
npm install -g @zcmsorg/cli@latest
zcms init
```

`init` はプラグインとテーマのどちらを作るかを尋ね、ビルド、型チェック、テスト、パッケージ化、署名に必要な設定を含むプロジェクトを生成します。実際のサイトでしか検証されない 2 つのビルド要件も、最初から満たしています。

そのうえで、開発対象に合った手順を選択してください。

- [プラグインを作成する](/ja/developers/plugin-handbook/getting-started/)
- [テーマを作成する](/ja/developers/theme-handbook/getting-started/)
- [`zcms` でひな型作成、パッケージ化、検証を行う](/ja/developers/cli/)
- [パッケージを Marketplace の審査へ提出する](/ja/marketplace/publishing/)
