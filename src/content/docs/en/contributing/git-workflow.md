---
title: Git workflow (Gitflow)
description: Z-CMS branching model — work on features, open PRs into develop, release through main.
sidebar:
  order: 1
---

Z-CMS uses a lean variant of Gitflow. There are two long-lived branches and two kinds
of short-lived branches; every change reaches the product through a **pull request
(PR)**, never a direct push to a shared branch.

## The branches

| Branch      | Direct push               | Merge PR                | Notes             |
| ----------- | ------------------------- | ----------------------- | ----------------- |
| `main`      | ❌ No                      | ✅ Only after review    | Release branch    |
| `develop`   | ❌ (or Lead only)          | ✅ Merge via PR         | Integration branch|
| `feature/*` | ✅ Branch owner            | Not required            | Normal            |
| `hotfix/*`  | Authorized people only    | Possible                | Per process       |

- **`main`** — the release branch. Always in a releasable state. Nobody pushes to it
  directly; it only receives reviewed merges from `develop` (or `hotfix/*`). Releases
  are cut and version tags are created from here.
- **`develop`** — the community integration branch. Every `feature/*` branch opens its
  PR here. Direct pushes are restricted (Lead only, when needed).
- **`feature/*`** — your working branch. You own it and may push to it freely. Name it
  after the work: `feature/plugin-webhooks`, `feature/theme-dark-mode`.
- **`hotfix/*`** — an urgent fix for something already released. Created only by
  authorized people; may merge into `main` (and back into `develop`) per process.

## Developer flow

This is the everyday flow when you contribute a feature or a fix.

```bash
# 1. Get the latest develop and branch off it
git checkout develop
git pull
git checkout -b feature/your-work

# 2. Do the work, commit in small, meaningful steps
git add -p
git commit -m "feat(plugin): ..."

# 3. Push your feature branch
git push -u origin feature/your-work

# 4. Open a PR that targets develop (NOT main)
gh pr create --base develop
```

Then **stop**: the Lead (Z-SOFT) reviews and merges your PR into `develop`. Do not
self-merge into `develop` or `main`.

### Rules

- **Base on `develop`.** Feature and fix PRs always target `develop`, never `main`.
- **Small, focused branches.** One branch per piece of work — easy to review, easy to
  revert.
- **Don't self-merge.** Merging into `develop` and releasing to `main` is the Lead's job.
- **Keep CI green.** Run `pnpm build` / tests locally before opening a PR; CI runs again
  on the PR.
- **Behavior and docs together.** A product behavior change and its documentation go in
  the same PR (see [Contribute to the documentation](/en/contributing/documentation/)).

## Release flow (done by the Lead)

Developers normally don't do this; it's here so you understand where your code lands.

1. The Lead merges `develop` into `main` via a reviewed PR.
2. CI on `main` is green.
3. A release is cut: version tag, image build, publish.

In short: **`feature/*` → `develop` → `main`**. You own the first arrow; the Lead owns
the rest.

## Commit naming

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`.
Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```
feat(theme-sdk): add archive channel to ThemeContext
fix(plugin-sdk): scope plugin table indexes by tenant_id, site_id
docs(contributing): add gitflow page
```
