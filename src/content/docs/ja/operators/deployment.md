---
title: 本番環境へのデプロイ
description: 公式 Docker イメージから Z-CMS をデプロイする方法と、運用に必要なコンポーネント・セキュリティ要件を説明します。
sidebar:
  order: 1
---

Z-CMS は、ソースからビルドしなくても導入できます。`linux/amd64` と `linux/arm64` に対応した公式 Docker イメージを、Docker Hub の [`zcms`](https://hub.docker.com/u/zcms) で提供しています。イメージはリリースごとに更新されます。

## 公式イメージでデプロイする（推奨）

[**z-cms-docker-offical-image**](https://github.com/zscontributor/z-cms-docker-offical-image) リポジトリには、公式イメージで Z-CMS を起動するための設定がそろっています。`docker compose` の構成、リバースプロキシの設定例（Traefik、Caddy、Nginx、Apache、Portainer）、変数の説明付き `.env`、秘密情報の生成と初期データ登録用のスクリプトが含まれます。

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

公開ドメインで HTTPS を自動設定するには、リバースプロキシ用の Compose 設定を追加します。Traefik を使う例は次のとおりです。

```bash
docker compose -f docker-compose.yml -f compose/traefik.yml up -d
./scripts/first-run-seed.sh -f docker-compose.yml -f compose/traefik.yml
```

リバースプロキシは `/api` を API、`/admin` を管理画面、`/zcms-media` をメディア配信へ転送し、それ以外を公開サイトへ振り分けます。設定、アップグレード、バックアップ、本番環境のセキュリティ対策は、同リポジトリのガイドを参照してください。

:::tip
本番環境では `ZCMS_VERSION` を `0.1.0` などの特定のリリースタグに固定してください。同じバージョンを再配置しやすくなり、問題があったときも以前のバージョンに戻せます。`latest` は常に最新リリースを指します。
:::

## 公開されているイメージ

| イメージ | 役割 |
| --- | --- |
| `zcms/cms-api` | コア API。データベースと S3 の認証情報を保持します。 |
| `zcms/site-runtime` | セキュリティ対策を施した環境でテーマを実行し、公開サイトを表示します。 |
| `zcms/admin-web` | 管理画面。 |
| `zcms/worker` | バックグラウンドジョブの処理。 |
| `zcms/plugin-runtime` | 認証情報を持たない、プラグイン実行用のサンドボックス。 |
| `zcms/migrate` | データ移行と署名済み組み込みパッケージの登録を一度実行します。 |

このほかに PostgreSQL、Redis、S3 互換のオブジェクトストレージが必要です。Compose に含まれるサービスを使うか、外部のマネージドサービスに接続します。

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

独自のフォークやカスタムビルドを運用する場合にのみ必要です。配布リポジトリには、ソースのモノレポから六つのマルチアーキテクチャイメージを作成する GitHub Actions ワークフローと `scripts/build-and-push.sh` があります。組み込みのテーマやプラグインを変更した場合は、自分の鍵で署名し直し、対応する公開鍵をすべての関連コンポーネントの `FIRST_PARTY_PUBLIC_KEY` に設定してください。
