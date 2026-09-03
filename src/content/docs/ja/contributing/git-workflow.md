---
title: Git の開発フロー（Gitflow）
description: feature ブランチで作業し、develop へプルリクエストを送り、main からリリースする流れを説明します。
sidebar:
  order: 1
---

Z-CMS では、Gitflow を簡略化したブランチ運用を採用しています。長期間使うブランチが二つ、一時的に使うブランチが二種類あります。変更はプルリクエスト（PR）で取り込み、共有ブランチには直接プッシュしません。

## ブランチ

| ブランチ | 直接プッシュ | PR のマージ | 用途 |
| --- | --- | --- | --- |
| `main` | 不可 | レビュー後のみ | リリース |
| `develop` | 原則不可。必要時は開発リードのみ | PR 経由 | 変更の統合 |
| `feature/*` | ブランチの作成者が可能 | 必須ではない | 機能追加・修正 |
| `hotfix/*` | 権限を持つ担当者のみ | 所定の手順に従う | 緊急修正 |

- **`main`：** 常にリリース可能な状態を保ちます。レビュー済みの `develop` または `hotfix/*` から変更を取り込み、リリースとバージョンタグを作成します。
- **`develop`：** 変更を統合するブランチです。`feature/*` の PR はここに送ります。直接プッシュできるのは、必要な場合の開発リードだけです。
- **`feature/*`：** 個人の作業ブランチです。`feature/plugin-webhooks` や `feature/theme-dark-mode` のように、作業内容が分かる名前にします。
- **`hotfix/*`：** リリース済みバージョンへの緊急修正用です。権限を持つ担当者が作成し、手順に従って `main` へマージした後、`develop` にも反映します。

## 開発者のフロー

機能追加や不具合修正では、次の手順で作業します。

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

PR を作成したら、Z-SOFT の開発リードによるレビューとマージを待ちます。自分で `develop` や `main` にマージしないでください。

### ルール

- **PR の宛先は `develop` にします。** 機能追加や修正を直接 `main` に送らないでください。
- **一つのブランチでは一つの作業に集中します。** 小さな変更に分けると、レビューや取り消しが容易になります。
- **共有ブランチへ自分でマージしません。** `develop` への統合と `main` からのリリースは開発リードが担当します。
- **すべてのチェックを成功させます。** PR の作成前にローカルで `pnpm build` とテストを実行します。PR でも CI が再実行されます。
- **動作変更とドキュメントを同じ PR に含めます。** 詳しくは [ドキュメントの作成・改善](/ja/contributing/documentation/) を参照してください。

## 開発リードが行うリリース手順

通常、開発者がこの手順を行う必要はありません。提出した変更がどのようにリリースされるかを把握するための説明です。

1. 開発リードがレビュー済みの PR を使い、`develop` を `main` にマージします。
2. `main` の CI がすべて成功したことを確認します。
3. バージョンタグを付け、イメージをビルドして公開します。

全体の流れは **`feature/*` → `develop` → `main`** です。開発者が変更と PR を用意し、開発リードが統合とリリースを担当します。

## コミットの命名

[Conventional Commits](https://www.conventionalcommits.org/) の形式 `type(scope): summary` を使います。種類を示す `type` には、主に `feat`、`fix`、`docs`、`refactor`、`test`、`chore` を指定します。

```
feat(theme-sdk): add archive channel to ThemeContext
fix(plugin-sdk): scope plugin table indexes by tenant_id, site_id
docs(contributing): add gitflow page
```
