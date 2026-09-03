---
title: プラグインのランタイム API
description: プラグインのフック、ctx オブジェクトの API、各操作に必要な権限を説明します。
sidebar:
  order: 3
---

プラグインは、`@zcmsorg/plugin-sdk` の `definePlugin` で作成したオブジェクトをエクスポートします。処理の実行タイミングはフックで定義し、外部のリソースには渡された `ctx` オブジェクトを通じてアクセスします。サンドボックスにはファイル操作 API、`process.env`、データベース接続、`fetch` はありません。プラグインが利用できる機能は、以下のフックと `ctx` メソッドに限られます。

すべての `ctx` メソッドは非同期（`async`）です。処理はプラグインの隔離環境内ではなく、RPC で呼び出されるホスト側で実行されます。ホストは呼び出しごとに権限を確認します。たとえば、`content:read` が付与されていなければ、ホスト側でアクセスが拒否されます。プラグイン内のコードを書き換えて、この検証を回避することはできません。

## プラグインオブジェクト

`definePlugin` は `manifest`（[最初のプラグインを作る](/ja/developers/plugin-handbook/getting-started/) を参照）と、以下の任意のフックを受け取ります。

| フック | 型 | 実行タイミング | 実行制限 |
| --- | --- | --- | --- |
| `setup(ctx)` | `() => void` | サイトで有効化するたびに実行。データ移行、サンプルデータや初期値の登録に使用します。 | — |
| `teardown(ctx)` | `() => void` | 無効化するたびに実行。例外が発生してもログに記録して状態遷移を続行します。アンインストール時の処理ではありません。 | — |
| `actions` | `{ [event]: (payload, ctx) => void }` | イベント発生後に実行。CMS は完了を待ちません。 | 非同期 |
| `filters` | `{ [name]: (value, context, ctx) => value }` | 処理中の値を変換。呼び出し元は結果を待ちます。制限時間を超えると元の値を使用します。 | 制限時間あり |
| `jobs` | `{ [name]: (payload, ctx) => void }` | `ctx.jobs.enqueue(name, payload)` で登録したジョブを、Web リクエストとは別に実行します。 | 30 秒 |
| `calls` | `{ [name]: (payload, ctx) => unknown }` | CMS から呼び出され、結果を返します。プラグインのキーではなく、ケイパビリティを通じて呼び出します。 | 30 秒 |

```ts
import { definePlugin } from "@zcmsorg/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "com.example.plugin.hello",
    name: "Hello Plugin",
    version: "0.1.0",
    author: { name: "Example Studio" },
    engine: ">=0.1.0",
    permissions: ["content:read"],
  },

  setup: async (ctx) => {
    ctx.log.info(`Activated on ${ctx.site.name}`);
  },

  actions: {
    "content.published": async (event, ctx) => {
      await ctx.storage.set(`last-published`, event.contentId);
    },
  },
});
```

:::caution[処理を実行する四つの方法]
初期化と終了処理を除き、プラグインの処理方法は四つです。**action** でイベントに応答し、**filter** で値を変換し、**call** で結果を返し、**job** で後から実行する処理を登録します。タイマーの設定、接続の確立、プラットフォームから独立したコードの実行はできません。
:::

## フックできるイベント

### Actions — イベント発生後に実行し、完了を待たない

| イベント | 渡されるデータ |
| --- | --- |
| `content.created` | `siteId, contentId, contentType, title` |
| `content.updated` | `siteId, contentId, contentType, title` |
| `content.published` | `siteId, contentId, contentType, title, path, publishedAt` |
| `content.unpublished` | `siteId, contentId, contentType` |
| `content.deleted` | `siteId, contentId` |
| `theme.activated` | `siteId, themeKey` |
| `plugin.activated` | `siteId, pluginId` |
| `mail.sent` | `siteId, pluginKey, to[], subject, messageId, sentAt` — サイトのメール送信ごとに届く通知。本文は含みません。 |
| `mail.failed` | `siteId, pluginKey, to[], subject, error, failedAt` |

### Filters — 処理中の値を変換し、制限時間内で結果を待つ

| フィルター | 値 | コンテキスト |
| --- | --- | --- |
| `content.seo` | `{ title?, description?, ogImage?, noindex?, canonical? }` — テーマが表示する直前のページの SEO 情報。 | `siteId, contentId, path, title` |
| `mail.sending` | `{ subject, text?, html?, replyTo?, send }` — SMTP で送信する直前のメール。送信を中止するには `send: false` を返します。 | `siteId, pluginKey, to[]` |

## `ctx` オブジェクト

| プロパティ | 用途 | 必要な権限・条件 |
| --- | --- | --- |
| `ctx.settings` | 現在のサイトのプラグイン設定。`settingsSchema` の初期値と統合されます。 | — |
| `ctx.secrets` | `{ placeholder: boolean }` で、管理者が入力済みの `network.secrets` を示します。秘密情報の値は含みません。 | — |
| `ctx.site` | 現在のサイトの `{ id, name, locale }`。 | — |
| `ctx.log` | `info / warn / error(message, meta?)` によるログ出力。 | — |
| `ctx.storage` | プラグインごと、サイトごとに分離されたキーバリューストレージ。 | — |
| `ctx.db` | プラグイン専用のリレーショナルテーブルへのアクセス。 | `data:own`、Z-CMS 提供のプラグイン、テーブル宣言 |
| `ctx.content` | サイトのコンテンツの読み取り。 | `content:read` |
| `ctx.jobs` | バックグラウンドジョブの登録。 | — |
| `ctx.mail` | サイトのメールサーバーを使った送信。 | `mail:send` |
| `ctx.http` | 宣言済みの外部ホストへのアクセス。 | `network:fetch` と `network.hosts` |

### `ctx.storage` — 基本となるキーバリューストレージ

```ts
await ctx.storage.set("counter", 3);
const n = await ctx.storage.get<number>("counter"); // 3, or null
await ctx.storage.list("prefix:");                  // [{ key, value }]
await ctx.storage.delete("counter");
```

専用テーブルを作る前に、まず `ctx.storage` を検討してください。データベースのスキーマを追加せずに利用でき、コミュニティ製と Z-CMS 提供のどちらのプラグインにも対応しています。キーと値は、プラグインごと、サイトごとに分離されます。

### `ctx.db` — プラグイン自身のテーブル

`data:own` が付与され、`manifest.database` でテーブルを宣言した Z-CMS 提供のプラグインだけが利用できます。データベース接続そのものは渡されず、トランザクションの直接操作や SQL 文字列の送信もできません。プラグインが自分のテーブル名と検索条件を指定すると、ホストがパラメーター付きのクエリを組み立て、トークンの `tenant_id`/`site_id` による制限を適用します。

```ts
await ctx.db.insert("p_com_example_plugin_hello__notes", { title: "Hi", body: "…" });
await ctx.db.select("p_com_example_plugin_hello__notes", {
  where: { title: "Hi" },
  orderBy: { column: "created_at", direction: "desc" },
  limit: 20,
});
await ctx.db.update("…__notes", { body: "edited" }, { id });
await ctx.db.delete("…__notes", { id });
```

**検索条件。** `where` に値を直接指定すると、等価比較になります（例：`{ stage: "lead" }`）。それ以外の比較には `{ column: { op, value } }` を使います。演算子は `eq`、`neq`、`lt`、`lte`、`gt`、`gte`、`contains`、`startsWith`、`in` です。条件は AND で結合され、`OR` や SQL の直接指定には対応していません。値はすべてクエリのパラメーターとして渡されます。

```ts
await ctx.db.select("…__customers", {
  where: {
    stage: { op: "in", value: ["lead", "qualified"] },
    name: { op: "contains", value: "an" },   // case-insensitive substring
    deal_value: { op: "gte", value: 100 },
  },
  orderBy: { column: "deal_value", direction: "desc" },
  limit: 50,
});
```

テーブルの宣言、メニューの付与、フィルタ済み一覧のテーマへの公開については [データテーブルと管理画面](/ja/developers/plugin-handbook/data-and-admin/) を参照してください。

### `ctx.content` — サイトコンテンツを読む

```ts
const page = await ctx.content.get(contentId);              // ContentDto | null
const posts = await ctx.content.list({ contentTypeKey: "post", status: "PUBLISHED" });
```

`content:read` 権限が必要な読み取り専用 API です。このオブジェクトにコンテンツを書き込むメソッドはありません。プラグインはデータベースの行を直接変更せず、`filters` と `actions` を通じてコンテンツの処理に関与します。

### `ctx.jobs` — バックグラウンドジョブを登録する

```ts
await ctx.jobs.enqueue("sync-catalog", { since: lastRun });
```

後から実行する処理は、この API で登録します。キューの処理時に、登録したデータが `jobs` 内の対応するハンドラーへ渡されます。ジョブは同じサンドボックスと権限範囲で、元の Web リクエストとは別に実行されます。ジョブの保存と失敗時の再試行はプラットフォームが管理します。

### `ctx.mail` — メールを送る

```ts
await ctx.mail.send({ to: "a@b.co", subject: "Hello", text: "…", replyTo: "me@site" });
```

`mail:send` 権限が必要です。送信元はサイトの設定を使うため、`from`、SMTP ホスト、認証情報は指定しません。`send` が完了するのはメールがキューに受け付けられた時点であり、送信完了時ではありません。送信結果は後から `mail.sent` または `mail.failed` で通知されます。送信頻度の制限と重複送信の防止はサイトごとに行われます。

### `ctx.http` — 外部サービスへアクセスする

```ts
const res = await ctx.http.fetch({
  url: "https://api.deepl.com/v2/translate",
  method: "POST",
  headers: { Authorization: "DeepL-Auth-Key {{secret:deeplKey}}" },
  body: { text: ["Hello"], target_lang: "VI" },
});
const data = JSON.parse(res.body); // body arrives as text
```

`network:fetch` 権限に加え、マニフェストの `network` で接続先ホストを宣言する必要があります。承認画面に表示されないホストには接続できません。ゲートウェイはプライベート、ループバック、リンクローカルの各アドレスを拒否し、リダイレクト先も毎回確認します。各リクエストは 10 秒、1&nbsp;MB までに制限され、サイトごとに 1 時間あたりの利用上限も適用されます。

:::note[秘密鍵の値を受け取らずに利用する]
`network.secrets` に宣言した設定は `ctx.settings` から除外されます。認証情報が必要な箇所に `{{secret:name}}` を指定すると、ホストの確認後、ゲートウェイがサンドボックスの外側で実際の値に置き換えます。プラグインのコードには値が渡らないため、コードが侵害されても秘密情報を直接読み取ることはできません。
:::

## プラグインが要求できる権限

`manifest.permissions` には、管理者の承認が必要な権限を列挙します。よく使う権限は次のとおりです。

| 権限 | 利用できる機能 |
| --- | --- |
| `content:read` | `ctx.content` |
| `content:create` · `content:update` · `content:delete` · `content:publish` | 対応する API を通じたコンテンツの書き込み。 |
| `media:read` · `media:upload` · `media:update` · `media:delete` | メディアライブラリへのアクセス。 |
| `mail:send` | `ctx.mail` |
| `network:fetch` | `ctx.http`。別途 `network` の宣言が必要です。 |
| `data:own` | `ctx.db` と `database` ブロック。Z-CMS 提供のプラグインのみ利用できます。 |

`permissions` は、プラグインが利用するために要求するプラットフォームの権限です。一方、`permissionsProvided` は、プラグイン自身の画面へのアクセスを制御するために新しく定義する権限です。詳しくは [データテーブルと管理画面](/ja/developers/plugin-handbook/data-and-admin/) と [プラグインの権限](/ja/developers/plugin-handbook/permissions/) を参照してください。

## 利用できないもの

`require` や `import` で利用できる外部モジュールは `@zcmsorg/plugin-sdk` だけです。`fs`、`process`、`process.env`、`fetch`、`WebSocket`、タイマー（`setTimeout`/`setInterval`）、データベースやネットワークへの直接接続は利用できません。コードを一つの CommonJS ファイルにまとめ、外部へのアクセスには `ctx` を使ってください。[最初のプラグインを作る](/ja/developers/plugin-handbook/getting-started/) も参照してください。
