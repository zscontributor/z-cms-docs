---
title: API リファレンス
description: Z-CMS が自動生成する OpenAPI ドキュメントの利用方法を説明します。
sidebar:
  order: 5
---

Z-CMS は、`cms-api` で定義されているルートから OpenAPI ドキュメントを自動生成します。

ローカル環境では、API を試しながら仕様を確認できるドキュメントを、次の URL で開けます。

```text
http://localhost:4100/api/v1/docs
```

OpenAPI JSON を出力するには、次のコマンドを実行します。

```bash
pnpm openapi
```

自動生成される API リファレンスを、エンドポイントとリクエスト・レスポンスのデータ構造を確認するための基準にしてください。各ガイドでは利用例と、アクセス時に守るべきセキュリティ上の制約を説明します。
