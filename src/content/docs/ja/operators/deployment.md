---
title: 本番環境へのデプロイ
description: 公式 Docker イメージから Z-CMS をデプロイする方法と、運用に必要なコンポーネント・セキュリティ要件を説明します。
sidebar:
  order: 1
---

Z-CMS を実行するのに、ソースからビルドする必要は **ありません**。マルチアーキ
テクチャ（`linux/amd64` + `linux/arm64`）の公式イメージが Docker Hub の
[`zcms`](https://hub.docker.com/u/zcms) で公開され、リリースごとに更新されます。

## 公式イメージでデプロイする（推奨）

[**z-cms-docker-offical-image**](https://github.com/zscontributor/z-cms-docker-offical-image)
リポジトリが、稼働中インスタンスへの最短ルートです。公式イメージを取得する完全な
`docker compose` スタック、すぐ使えるリバースプロキシ設定（Traefik、Caddy、Nginx、
Apache、Portainer）、各設定を説明する `.env`、シークレット生成と初回シード用の
ヘルパースクリプトを提供します。

```bash
git clone https://github.com/zscontributor/z-cms-docker-offical-image.git zcms
cd zcms

# 1. 強力なランダムシークレット付きの .env を作成
cp .env.example .env
./scripts/generate-secrets.sh --write

# 2. スタックを起動（Docker Hub から zcms/* を取得）
docker compose up -d

# 3. 最初の管理者 + デモサイトを作成（1 回だけ）
./scripts/first-run-seed.sh
```

自動 HTTPS 付きの公開ドメインで運用するには、リバースプロキシのオーバーレイを
重ねます（例: Traefik）:

```bash
docker compose -f docker-compose.yml -f compose/traefik.yml up -d
./scripts/first-run-seed.sh -f docker-compose.yml -f compose/traefik.yml
```

各プロキシは `/api` → API、`/admin` → 管理 UI、`/zcms-media` → メディア、その他
すべて → 公開サイト、へルーティングします。設定・アップグレード・バックアップ・
本番向けハードニングの詳細ガイドは、そのリポジトリにあります。

:::tip
本番では再現性のあるロールアウトと容易なロールバックのため、`ZCMS_VERSION` を
特定のリリースタグ（例: `0.1.0`）に固定してください。`latest` は最新リリースを
追従します。
:::

## 公開されているイメージ

| イメージ | 役割 |
| --- | --- |
| `zcms/cms-api` | コア API（DB/S3 認証情報を保持） |
| `zcms/site-runtime` | 公開サイト（テーマコードを実行 — ハードニング済み） |
| `zcms/admin-web` | 管理 UI |
| `zcms/worker` | バックグラウンドジョブ |
| `zcms/plugin-runtime` | 信頼できないプラグインのサンドボックス（認証情報なし） |
| `zcms/migrate` | 単発実行: マイグレーション + 署名付き組み込みの登録 |

完全なデプロイには PostgreSQL、Redis、S3 互換オブジェクトストレージも必要です
（compose スタックに同梱、またはマネージドプロバイダーを指定）。

## チェックリスト

- サービスごとに異なる認証情報を使用します。
- アプリケーション用データベースロールが `NOBYPASSRLS` で、テーブル所有者ではないことを確認します。
- プラグインランタイムにデータベース、S3、セッションの認証情報を渡しません。
- 信頼できる情報源から取得した `MARKETPLACE_PUBLIC_KEY` を固定して使用します（`.env.example`
  に同梱の `FIRST_PARTY_PUBLIC_KEY` の既定値は、すでに公式イメージと一致しています）。
- 公開するすべてのホスト名で TLS を有効にします。
- 新しいバージョンへトラフィックを切り替える前にマイグレーションを実行します（`migrate`
  ジョブが `up` のたびに自動実行します）。
- バックアップを設定し、定期的に復元テストを行います。

:::danger
`APP_DATABASE_URL` にデータベース所有者のロールを使用しないでください。テーブル所有者は Row-Level Security を迂回できるため、テナント分離が失われます。
:::

## 独自イメージのビルド

フォークやカスタムビルドの場合にのみ必要です。配布リポジトリには、ソースモノレポ
から 6 つのイメージをマルチアーキテクチャでビルドする GitHub Actions ワークフローと
`scripts/build-and-push.sh` が同梱されています。組み込みテーマ/プラグインを変更する
フォークは、自身の鍵で署名し直し、対応する公開鍵を `FIRST_PARTY_PUBLIC_KEY` として
すべての場所に設定する必要があります。
