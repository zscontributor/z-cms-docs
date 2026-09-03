---
title: ページとブログ記事を表示する
description: site-runtime からテーマへ渡されるデータを使い、ページ、記事、一覧、フィールド、ブロック、メニュー、多言語リンクを表示する方法を説明します。
sidebar:
  order: 2
---

Z-CMS のテーマは、ページやブログ記事を取得するために Content API を直接呼び出しません。公開 URL へのアクセスごとに `site-runtime` が対象サイトを特定し、使用中のテーマにデータを渡します。テーマは受け取ったデータの表示だけを担当します。

リクエストは次の順序で処理されます。

1. 訪問者が公開 URL にアクセスします。
2. `site-runtime` が内部の Render API を一度呼び出します。
3. API がホスト名からサイトを特定し、言語、ルート、公開済みコンテンツ、メニュー、テーマ設定、有効なプラグインのケイパビリティを取得します。
4. `site-runtime` が適切なテンプレートを選びます。
5. テンプレートが `content`、`archive`、`ctx` のデータを使って画面を生成します。

:::caution[テーマから Render API を呼び出さないでください]
内部 API の `GET /api/v1/render/resolve` は、内部トークンによる認証が必要です。呼び出しは `site-runtime` が担当し、テーマから直接利用するものではありません。API クライアントや `fetch` を追加したり、内部トークンをテーマに埋め込んだりしないでください。
:::

## ステップ 1: テンプレートの型をインポートする

`@zcmsorg/theme-sdk` の型を使い、テンプレートの入力をランタイムのデータ仕様に合わせます。

```tsx
import {
  defineTheme,
  type ArchiveTemplateProps,
  type PageTemplateProps,
  type ThemeManifest,
} from "@zcmsorg/theme-sdk";
import manifestJson from "../theme.json";

const manifest = manifestJson as unknown as ThemeManifest;

interface Settings {
  accent: string;
}
```

`cms-api`、`site-runtime`、Prisma など、Z-CMS の内部モジュールから型をインポートしないでください。

## ステップ 2: ページを表示する

ランタイムは、URL に一致する公開済みページを `content` として渡します。

```tsx
function Page({ ctx, content }: PageTemplateProps<Settings>) {
  return (
    <article>
      <h1>{content.title}</h1>
      {content.excerpt ? <p>{content.excerpt}</p> : null}
      <div>{ctx.renderBlocks(content.blocks)}</div>
    </article>
  );
}
```

よく使う `content` のフィールドは次のとおりです。

| フィールド | 用途 |
| --- | --- |
| `title` | ページまたは記事のタイトル |
| `excerpt` | 省略可能な概要 |
| `path` | 言語の接頭辞を付ける前のコンテンツパス |
| `contentType.key` | `page` や `post` などのコンテンツタイプのキー |
| `data` | コンテンツタイプで定義したカスタムフィールド |
| `blocks` | エディターで作成したブロックデータ |
| `publishedAt` | 公開日時または `null` |
| `author` | 投稿者情報または `null` |
| `seo` | コンテンツごとに処理済みの SEO 情報 |

表示用データには公開済みコンテンツだけが含まれます。テーマ側で下書きを除外する必要はありません。

## ステップ 3: カスタムフィールドを安全に読む

`content.data` の値は JSON であり、型は `unknown` です。表示する前に値を検証してください。

```tsx
function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function Page({ ctx, content }: PageTemplateProps<Settings>) {
  const subtitle = text(content.data.subtitle);

  return (
    <article>
      <h1>{content.title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {ctx.renderBlocks(content.blocks)}
    </article>
  );
}
```

`content.data` 全体を型アサーションだけで既知のインターフェースとして扱わず、実行時に値を検証してください。サイト管理者はテーマを更新せずにコンテンツタイプのフィールドを変更できます。

## ステップ 4: ブログ記事を表示する

`content.contentType.key` が `post` の場合、`site-runtime` は `templates.post` を選択します。テーマが `post` を提供していない場合は `templates.page` を使用します。

```tsx
function Post({ ctx, content }: PageTemplateProps<Settings>) {
  const date = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString(ctx.locale)
    : "";

  return (
    <article>
      <a href={ctx.url("/blog")}>ブログ一覧へ戻る</a>
      <h1>{content.title}</h1>
      <p>{[date, content.author?.name].filter(Boolean).join(" · ")}</p>
      {content.excerpt ? <p>{content.excerpt}</p> : null}
      {ctx.renderBlocks(content.blocks)}
    </article>
  );
}
```

## ステップ 5: ブログ一覧を表示する

`/blog` などの一覧ルートには、`content` ではなく `archive` が渡されます。ランタイムが公開済み記事とページネーション情報を提供します。

```tsx
function Archive({ ctx, archive }: ArchiveTemplateProps<Settings>) {
  return (
    <section>
      <h1>{archive.title}</h1>

      {archive.items.length === 0 ? (
        <p>記事はまだありません。</p>
      ) : (
        <ul>
          {archive.items.map((item) => (
            <li key={item.id}>
              <a href={ctx.url(item.path)}>{item.title}</a>
              {item.excerpt ? <p>{item.excerpt}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {archive.page > 1 ? (
        <a href={ctx.url(`${archive.basePath}?page=${archive.page - 1}`)}>前のページ</a>
      ) : null}
      {archive.page < archive.totalPages ? (
        <a href={ctx.url(`${archive.basePath}?page=${archive.page + 1}`)}>次のページ</a>
      ) : null}
    </section>
  );
}
```

コンテンツや一覧へのサイト内リンクは、必ず `ctx.url()` で生成してください。言語の接頭辞が付与され、クエリ文字列も保持されます。ただし、`ctx.alternates` のパスは完成済みなので、`ctx.url()` に再度渡してはいけません。

## ステップ 6: テンプレートを登録する

`page` テンプレートは必須です。その他のコンテンツテンプレートは `page` にフォールバックできますが、一覧ルートには `archive` が必要です。

```tsx
export default defineTheme<Settings>({
  manifest,
  Layout,
  templates: {
    home: Home,
    page: Page,
    post: Post,
    archive: Archive,
    notFound: NotFound,
    error: ErrorPage,
  },
  blocks,
});
```

| リクエスト | 選択されるテンプレート |
| --- | --- |
| ホームのコンテンツがある `/` | `home`。このテンプレートがなければ `page` |
| キーが `post` のコンテンツ | `post`。このテンプレートがなければ `page` |
| その他のコンテンツ | `page` |
| `/blog` などのコンテンツタイプの一覧 | `archive` |
| 存在しないパス | `notFound` |

## ステップ 7: ブロックを表示する

各テンプレートでブロックを一つずつ処理する代わりに、`ctx.renderBlocks(content.blocks)` を呼び出します。対応するブロックタイプごとに表示コンポーネントを登録してください。

```tsx
import type { BlockProps } from "@zcmsorg/theme-sdk";

function value(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function Hero({ props }: BlockProps<Record<string, unknown>, Settings>) {
  return (
    <section>
      <h2>{value(props.heading)}</h2>
      {props.subheading ? <p>{value(props.subheading)}</p> : null}
    </section>
  );
}

const blocks = {
  "core/hero": Hero,
  "core/richtext": RichText,
  "core/features": Features,
  "core/image": ImageBlock,
  "core/cta": CallToAction,
};
```

ブロックタイプ名には名前空間が必要です。未対応のブロックは、開発環境では警告を表示し、本番環境では表示を省略します。対象サイトで使うすべてのブロックタイプを確認してください。

## ステップ 8: メニュー、アセット、多言語リンクを表示する

- `ctx.menus.primary`、`ctx.menus.footer`、または `theme.json` で宣言した別のキーからメニューを読み取ります。
- サイト内リンクには `ctx.url(path)` を使います。
- テーマに同梱するファイルの URL は `ctx.asset("assets/logo.png")` で生成します。
- サイト共通のロゴとメインカラーは `ctx.site.brand` を参照します。
- テーマ固有の設定は `ctx.settings` を参照します。
- 言語の切り替えには `ctx.alternates` を使います。

## ステップ 9: コンテンツフロー全体を確認する

パッケージ化する前に、次をテストしてください。

1. 概要があるページとないページ。
2. テーマが対応する標準ブロックをすべて含むページ。
3. 投稿者や公開日時がある記事とない記事。
4. 空のブログ一覧と複数ページにまたがる一覧。
5. カスタムフィールドがない場合や、想定外の型になっている場合。
6. 既定の言語とそれ以外の言語。特に一覧のページ切り替えリンク。
7. 未対応のブロックがあっても、ページ全体を表示できること。

次に、[テーマとプラグインを連携する方法](/ja/developers/theme-handbook/plugin-integration/)を確認してください。
