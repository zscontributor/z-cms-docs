---
title: プラグインランタイム API
description: プラグインが実装するフックと呼び出せる ctx API、そしてそれぞれに必要なスコープ。
sidebar:
  order: 3
---

プラグインは `@zcmsorg/plugin-sdk` の `definePlugin` で構築した 1 つのオブジェクトをエクスポートします。プラグインが *できる* ことはすべて実装するフックであり、*触れられる* ものはすべて渡される `ctx` オブジェクトのメソッドです。サンドボックス内には `require` も `fs` も `process.env` もデータベースハンドルも `fetch` も存在しません。ある機能が以下のフックや `ctx` メソッドのいずれでもなければ、プラグインはそれを実行できません。

すべての `ctx` メソッドは `async` です。いずれもプラグインの isolate 内では実行されず、ホストへ RPC を呼び戻すためです。ホストは呼び出しのたびにプラグインへ付与されたスコープを再チェックします。`content:read` を一度も要求していないプラグインは、パッチで無効化できるローカルチェックではなく、ホストからの拒否を受け取ります。

## プラグインオブジェクト

`definePlugin` は `manifest`（[最初のプラグインを作る](/ja/developers/plugin-handbook/getting-started/) を参照）と、以下の任意のフックを受け取ります。

| Hook | 形 | 実行タイミング | 予算 |
| --- | --- | --- | --- |
| `setup(ctx)` | `() => void` | プラグインがサイト上で有効化されたときに 1 回 — マイグレーション、シードデータ、デフォルト値。 | — |
| `teardown(ctx)` | `() => void` | 無効化時に 1 回。ここでの throw はログに記録され、遷移はそのまま進行します。アンインストールではありません。 | — |
| `actions` | `{ [event]: (payload, ctx) => void }` | 何かが起きた **後** の fire-and-forget。CMS は待機しません。 | async |
| `filters` | `{ [name]: (value, context, ctx) => value }` | 値を **処理中** に変換します。呼び出し元は待機します。タイムアウトを超過した filter はスキップされ、元の値が使われます。 | ハードキャップあり |
| `jobs` | `{ [name]: (payload, ctx) => void }` | 遅延処理。先行する `ctx.jobs.enqueue(name, payload)` がリクエストパス外で処理されるときに実行されます。 | 30s |
| `calls` | `{ [name]: (payload, ctx) => unknown }` | リクエスト／レスポンス — CMS が呼び出し、**返り値を待ちます**。プラグインキーではなくケイパビリティで到達します。 | 30s |

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

:::caution[この4つの形だけが処理を行う]
プラグインはタイマーを設定したり、コネクションを開いたり、自ら独自にコードを実行したりできません。**action** に反応し、**filter** を変換し、**call** に応答し、あるいはプラットフォームに後で **job** を実行するよう依頼するだけです。これがプラグインの制御フローのすべてです。
:::

## フックできるイベント

### Actions — 事後に発火し、await されない

| Event | Payload |
| --- | --- |
| `content.created` | `siteId, contentId, contentType, title` |
| `content.updated` | `siteId, contentId, contentType, title` |
| `content.published` | `siteId, contentId, contentType, title, path, publishedAt` |
| `content.unpublished` | `siteId, contentId, contentType` |
| `content.deleted` | `siteId, contentId` |
| `theme.activated` | `siteId, themeKey` |
| `plugin.activated` | `siteId, pluginId` |
| `mail.sent` | `siteId, pluginKey, to[], subject, messageId, sentAt` — サイト上の *すべて* の送信に対するレシート。本文は含みません。 |
| `mail.failed` | `siteId, pluginKey, to[], subject, error, failedAt` |

### Filters — 値を処理中に変換する。ブロッキングかつ上限あり

| Filter | Value | Context |
| --- | --- | --- |
| `content.seo` | `{ title?, description?, ogImage?, noindex?, canonical? }` — テーマがレンダリングする直前の、ページのメタデータ。 | `siteId, contentId, path, title` |
| `mail.sending` | `{ subject, text?, html?, replyTo?, send }` — SMTP 直前の送信メール。配信を取り消すには `send: false` を返します。 | `siteId, pluginKey, to[]` |

## `ctx` オブジェクト

| Property | 内容 | 必要なスコープ |
| --- | --- | --- |
| `ctx.settings` | **このサイト** に対するプラグインの設定。`settingsSchema` のデフォルトとマージされます。 | — |
| `ctx.secrets` | `{ placeholder: boolean }` — 宣言した `network.secrets` のうち管理者が入力したもの。値そのものは含みません。 | — |
| `ctx.site` | 現在のサイトの `{ id, name, locale }`。 | — |
| `ctx.log` | `info / warn / error(message, meta?)`。 | — |
| `ctx.storage` | (プラグイン, サイト) に名前空間化されたキーバリューストレージ。 | — |
| `ctx.db` | プラグイン **自身** のリレーショナルテーブル。 | `data:own` + first-party + 宣言済みテーブル |
| `ctx.content` | サイトのコンテンツを読み取る。 | `content:read` |
| `ctx.jobs` | バックグラウンド処理をキューに入れる。 | — |
| `ctx.mail` | サイトのメールサーバー経由でメールを送信する。 | `mail:send` |
| `ctx.http` | 宣言済みの外部ホストへアクセスする。 | `network:fetch` + `network.hosts` |

### `ctx.storage` — キーバリュー、デフォルトのストア

```ts
await ctx.storage.set("counter", 3);
const n = await ctx.storage.get<number>("counter"); // 3, or null
await ctx.storage.list("prefix:");                  // [{ key, value }]
await ctx.storage.delete("counter");
```

リレーショナルテーブルより先にこれを検討してください。`ctx.storage` だけを使うプラグインはスキーマのフットプリントをまったく持たず、コミュニティ製・first-party を問わずどのプラグインでも利用できます。キーと値はプラグインごと *かつ* サイトごとに分離されます。

### `ctx.db` — プラグイン自身のテーブル

`data:own` を保持し、`manifest.database` でテーブルを宣言した first-party プラグインだけが利用できます。これはデータベースハンドルではありません。コネクションもトランザクションも SQL 文字列も存在しません。自分が所有するテーブル名と単純な等価フィルタを指定すると、ホストが境界の向こう側でパラメータ化クエリを構築し、あなたのトークンから `tenant_id`/`site_id` を各行に刻印します。

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

テーブルの宣言とメニューの付与については [データテーブルと管理画面](/ja/developers/plugin-handbook/data-and-admin/) を参照してください。

### `ctx.content` — サイトコンテンツを読む

```ts
const page = await ctx.content.get(contentId);              // ContentDto | null
const posts = await ctx.content.list({ contentTypeKey: "post", status: "PUBLISHED" });
```

読み取り専用で、`content:read` によってゲートされます。コンテンツの書き込みはこのオブジェクトにはありません。プラグインは行を書き込むのではなく、`filters` と `actions` を通じてコンテンツに影響を与えます。

### `ctx.jobs` — 後で処理する

```ts
await ctx.jobs.enqueue("sync-catalog", { since: lastRun });
```

プラグインが遅延処理を行う唯一の手段です。キューが処理するときに、payload が `jobs` 内の対応するハンドラへ渡されます。同じサンドボックス、同じスコープで、リクエストパス外で、その背後には永続性とリトライがあります。

### `ctx.mail` — メールを送る

```ts
await ctx.mail.send({ to: "a@b.co", subject: "Hello", text: "…", replyTo: "me@site" });
```

`mail:send` が必要です。`from` はなく（エンベロープ送信者はサイトのものです）、SMTP ホストや認証情報もなく、配信結果もありません。`send` はメールがキューに受理された時点で resolve します。結果は後から `mail.sent` / `mail.failed` アクションとして届きます。送信はサイトごとにレート制限され、重複排除されます。

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

`network:fetch` **と**、ホストを指定する manifest 内の `network` ブロックが必要です。プラグインは、管理者が同意画面で目にしていないホストへは到達できません。ゲートウェイはプライベート・ループバック・リンクローカルアドレスを（すべてのリダイレクトでも）拒否し、各リクエストを 10s および 1&nbsp;MB に制限し、サイトごとの時間あたりクォータを課します。

:::note[鍵を保持せずに使う]
`network.secrets` の下に名前を付けた設定は `ctx.settings` から除外されます。認証情報が入る場所に `{{secret:name}}` と書けば、ゲートウェイがホストチェックの **後** に、サンドボックスの向こう側で実際の値に置換します。侵害されたプラグインは、受け取ったことのない鍵を持ち出すことはできません。
:::

## プラグインが要求できるスコープ

`manifest.permissions` には、管理者が同意画面で承認するスコープを列挙します。プラグインが最もよく必要とするものは以下のとおりです。

| Scope | 付与するもの |
| --- | --- |
| `content:read` | `ctx.content` |
| `content:create` · `content:update` · `content:delete` · `content:publish` | それらを公開するパス上でのコンテンツ書き込み。 |
| `media:read` · `media:upload` · `media:update` · `media:delete` | メディアライブラリへのアクセス。 |
| `mail:send` | `ctx.mail` |
| `network:fetch` | `ctx.http`（`network` 宣言とともに） |
| `data:own` | `ctx.db` と `database` ブロック（first-party のみ） |

`permissions` は、プラグインが **使うために要求する** コアスコープです。`permissionsProvided` と混同しないでください。後者は、プラグインが自身の画面をゲートするために **新たに生み出す** パーミッションキーです — [データテーブルと管理画面](/ja/developers/plugin-handbook/data-and-admin/) および [パーミッション](/ja/developers/plugin-handbook/permissions/) を参照してください。

## 利用できないもの

`require` はなく、`@zcmsorg/plugin-sdk` 以外の `import` もなく、`fs`、`process`、`process.env`、`fetch`、`WebSocket`、タイマー（`setTimeout`/`setInterval`）、そしてデータベースやネットワークのハンドルもありません。単一の CommonJS ファイルにバンドルし（[最初のプラグインを作る](/ja/developers/plugin-handbook/getting-started/) を参照）、外の世界へは `ctx` を通じてのみアクセスしてください。
