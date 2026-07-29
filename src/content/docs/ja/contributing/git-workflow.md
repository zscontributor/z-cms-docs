---
title: Git ワークフロー (Gitflow)
description: Z-CMS のブランチモデル — feature で作業し、develop へ PR、main でリリース。
sidebar:
  order: 1
---

Z-CMS は Gitflow の簡素な派生形を採用しています。長期ブランチが 2 つ、短期ブランチが
2 種類あり、すべての変更は**プルリクエスト (PR)** を通じて製品に入ります。共有ブランチ
への直接 push は行いません。

## ブランチ

| ブランチ    | 直接 push                 | PR マージ               | 備考             |
| ----------- | ------------------------- | ----------------------- | ---------------- |
| `main`      | ❌ 不可                    | ✅ レビュー後のみ       | リリースブランチ |
| `develop`   | ❌ (または Lead のみ)      | ✅ PR 経由でマージ      | 統合ブランチ     |
| `feature/*` | ✅ ブランチ所有者          | 不要                    | 通常             |
| `hotfix/*`  | 権限を持つ人のみ           | 可能                    | 手順に従う       |

- **`main`** — リリースブランチ。常にリリース可能な状態を保ちます。誰も直接 push せず、
  レビュー済みの `develop`（または `hotfix/*`）からのマージのみを受け付けます。リリース
  とバージョンタグはここから作成します。
- **`develop`** — コミュニティの統合ブランチ。すべての `feature/*` ブランチはここへ PR
  を出します。直接 push は制限されます（必要時に Lead のみ）。
- **`feature/*`** — あなたの作業ブランチ。所有者として自由に push できます。作業内容に
  沿って命名します：`feature/plugin-webhooks`、`feature/theme-dark-mode`。
- **`hotfix/*`** — リリース済みのものに対する緊急修正。権限を持つ人のみが作成し、手順に
  従って `main`（および `develop` へ戻す）にマージできます。

## 開発者のフロー

機能や修正を貢献する際の日常的なフローです。

```bash
# 1. 最新の develop を取得し、そこからブランチを切る
git checkout develop
git pull
git checkout -b feature/your-work

# 2. 作業し、小さく意味のある単位でコミットする
git add -p
git commit -m "feat(plugin): ..."

# 3. feature ブランチを push する
git push -u origin feature/your-work

# 4. develop を対象に PR を出す（main ではない）
gh pr create --base develop
```

その後は**止まります**：Lead (Z-SOFT) が PR をレビューし、`develop` へマージします。
`develop` や `main` へ自分でマージしないでください。

### ルール

- **base は `develop`。** 機能・修正の PR は常に `develop` を対象にし、`main` にはしません。
- **小さく焦点を絞ったブランチ。** 1 ブランチ 1 作業 — レビューも revert も容易です。
- **自分でマージしない。** `develop` へのマージと `main` へのリリースは Lead の役割です。
- **CI を緑に保つ。** PR を出す前にローカルで `pnpm build` / テストを実行します。PR 上でも
  CI が再実行されます。
- **挙動とドキュメントは一緒に。** 製品の挙動変更とそのドキュメントは同じ PR に入れます
  （[ドキュメントに貢献する](/ja/contributing/documentation/) を参照）。

## リリースフロー (Lead が実施)

開発者は通常これを行いません。コードの行き先を理解するために記載します。

1. Lead がレビュー済みの PR で `develop` を `main` にマージします。
2. `main` の CI が緑になります。
3. リリースを切ります：バージョンタグ、イメージビルド、公開。

要するに **`feature/*` → `develop` → `main`**。最初の矢印はあなたが担い、残りは Lead が
担います。

## コミットの命名

[Conventional Commits](https://www.conventionalcommits.org/) を使います：`type(scope): summary`。
よく使う type：`feat`、`fix`、`docs`、`refactor`、`test`、`chore`。

```
feat(theme-sdk): add archive channel to ThemeContext
fix(plugin-sdk): scope plugin table indexes by tenant_id, site_id
docs(contributing): add gitflow page
```
