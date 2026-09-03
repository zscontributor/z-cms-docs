---
title: テーマとプラグインを連携する
description: プラグインの内部実装に依存せず、ケイパビリティと名前空間付きブロックで連携する方法を説明します。
sidebar:
  order: 3
---

テーマとプラグインは互いのコードをインポートしません。プラグインが機能識別子（ケイパビリティ）を宣言すると、有効な機能の一覧が表示用データに含まれます。テーマは `ctx.hasCapability()` で利用可能かどうかを確認します。

:::note[ケイパビリティが表すもの]
ケイパビリティは `commerce.products` や `reviews.summary` などの機能識別子です。プラグインのデータは含まれず、設定、ストレージ、データベース、API へのアクセス権をテーマに与えるものでもありません。
:::

## ステップ 1：公開する連携仕様を決める

特定の実装や製品名ではなく、機能を表す名前を選びます。名前空間を付け、バージョンが変わっても使い続けられる識別子にしてください。

適切な例:

- `reviews.summary`
- `commerce.products`
- `search.facets`

`acme-plugin-v2-installed` のように、特定のインストールやバージョンに結び付いた名前は避けてください。

次に、公開データをどこから受け取るかを決めます。

- ページに保存済みのデータは、ブロックのプロパティ（props）で渡します。
- リクエストごとに生成するデータは、プラットフォームの表示用データに専用フィールドを設けて渡します。そのためには Z-CMS コア側の仕様変更が必要です。
- テーマからプラグインや CMS の非公開エンドポイントを呼び出さないでください。

## ステップ 2：プラグインでケイパビリティを宣言する

プラグインの `plugin.json` にケイパビリティを追加します。

```json
{
  "id": "com.acme.plugin.reviews",
  "capabilities": ["reviews.summary"]
}
```

インストール済みで、かつ有効なプラグインだけが、表示用データにケイパビリティを追加します。プラグインを無効にすると、そのケイパビリティも一覧からなくなります。

## ステップ 3：テーマで任意の連携機能として宣言する

`theme.json` にケイパビリティを追加します。

```json
{
  "id": "com.acme.theme.storefront",
  "optionalCapabilities": ["reviews.summary"]
}
```

これは任意の機能です。プラグインが未インストール、無効、または別のプラグインに置き換えられた場合でも、テーマは表示できなければなりません。

## ステップ 4: テンプレートで機能を検出する

`ctx.hasCapability()` を使用し、必ずフォールバック表示を用意します。

```tsx
function ProductPage({ ctx, content }: PageTemplateProps<Settings>) {
  const reviewsEnabled = ctx.hasCapability("reviews.summary");

  return (
    <article>
      <h1>{content.title}</h1>
      {ctx.renderBlocks(content.blocks)}
      {!reviewsEnabled ? <p>レビュー機能は現在利用できません。</p> : null}
    </article>
  );
}
```

分かるのは、その機能を提供するプラグインが有効かどうかだけです。レビューなどのレコードが返るわけではありません。

## ステップ 5: プラグイン関連ブロックを表示する

ページに名前空間付きのブロックがあり、その props に公開用データが保存されている場合は、対応する表示コンポーネントをテーマに登録します。

`content.blocks` に保存されるブロックの例:

```json
{
  "id": "review-summary-1",
  "type": "acme/review-summary",
  "props": {
    "average": 4.8,
    "count": 124
  }
}
```

テーマ側の表示コンポーネント：

```tsx
interface ReviewSummaryProps {
  average?: unknown;
  count?: unknown;
}

function ReviewSummary({
  ctx,
  props,
}: BlockProps<ReviewSummaryProps, Settings>) {
  if (!ctx.hasCapability("reviews.summary")) return null;

  const average = typeof props.average === "number" ? props.average : 0;
  const count = typeof props.count === "number" ? props.count : 0;

  return (
    <section aria-label="レビュー">
      <strong>{average.toFixed(1)} / 5</strong>
      <span>{count} 件のレビュー</span>
    </section>
  );
}

const blocks = {
  "core/hero": Hero,
  "core/richtext": RichText,
  "acme/review-summary": ReviewSummary,
};
```

プラグインのブロックも、Z-CMS 標準のブロックと同様に props を検証してください。値が欠けていたり、古いプラグインのデータ形式が残っていたりする可能性があります。

## ステップ 6: プラグインがない場合や変更された場合に対応する

次の状態をすべてテストしてください。

1. プラグインがインストールされていない。
2. インストール済みだが無効になっている。
3. 有効で、想定したブロックデータがある。
4. ケイパビリティはあるが、ブロックの props が空、または古いスキーマのままである。
5. ページにブロックが残っているが、プラグインがケイパビリティを提供しなくなっている。

どの状態でもページの主要機能を使えるようにしてください。ナビゲーション、タイトル、本文を任意のケイパビリティだけに依存させてはいけません。

## 現在の連携仕様の制限

Theme SDK は、プラグインとの間接的な連携をサポートしています。`ctx.hasCapability()` で機能の有無を確認し、`ctx.getIntegration()` でコアが公開を許可したデータを読み取り、`ctx.renderSlot()` でランタイム管理の対話型 UI を配置します。テーマにプラグインのコードや認証情報を渡すことはありません。

現在の仕様では、テーマから次の操作はできません。

- 任意のプラグインハンドラーを直接呼び出す。`ctx.callPlugin()` や `ctx.callCapability()` はありません。
- プラグインの設定やストレージを読み取る。
- プラグイン専用のデータベーステーブルを直接検索する。
- `ctx.hasCapability()` からプラグインのデータを取得する。
- パッケージだけで新しい動的データ形式を登録する。

リクエストに応じたデータや操作が必要な場合は、コアが対応する公開データや連携操作を定義し、明示的に許可する必要があります。たとえば `ai.assistant` は、`getIntegration()` で表示用データを提供し、`renderSlot("floating")` でチャット UI を配置します。ゲートウェイが許可するのは `chat` 操作だけです。任意のプラグインを呼び出せる汎用プロキシではありません。テーマから非公開 API を呼ぶ方法はサポート対象外であり、安全性も保証できません。

テンプレートのデータフロー全体については、[ページとブログ記事を表示する](/ja/developers/theme-handbook/rendering-content/)を参照してください。
