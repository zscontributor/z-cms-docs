---
title: Quy trình Git (Gitflow)
description: Mô hình nhánh của Z-CMS — làm việc trên feature, mở PR vào develop, release qua main.
sidebar:
  order: 1
---

Z-CMS dùng một biến thể gọn của Gitflow. Có hai nhánh tồn tại lâu dài và hai loại
nhánh tạm thời; mọi thay đổi đi vào sản phẩm qua **pull request (PR)**, không push
thẳng vào nhánh chung.

## Các nhánh

| Nhánh       | Push trực tiếp             | Merge PR                | Ghi chú        |
| ----------- | -------------------------- | ----------------------- | -------------- |
| `main`      | ❌ Không                    | ✅ Chỉ merge sau review | Nhánh release  |
| `develop`   | ❌ (hoặc chỉ Lead)          | ✅ Merge qua PR         | Nhánh tích hợp |
| `feature/*` | ✅ Chủ nhánh                | Không bắt buộc          | Nhánh thường   |
| `hotfix/*`  | Chỉ người được phân quyền  | Có thể                  | Tùy quy trình  |

- **`main`** — nhánh phát hành. Luôn ở trạng thái release được. Không ai push thẳng;
  chỉ nhận merge từ `develop` (hoặc `hotfix/*`) sau khi review. Từ đây cắt release và
  gắn tag phiên bản.
- **`develop`** — nhánh tích hợp của cộng đồng developer. Mọi nhánh `feature/*` mở PR
  vào đây. Push thẳng bị hạn chế (chỉ Lead khi cần).
- **`feature/*`** — nhánh làm việc của bạn. Bạn toàn quyền push lên nhánh feature của
  mình. Đặt tên theo việc: `feature/plugin-webhooks`, `feature/theme-dark-mode`.
- **`hotfix/*`** — sửa gấp cho bản đã release. Chỉ người được phân quyền tạo, có thể
  merge vào `main` (và về lại `develop`) theo quy trình.

## Luồng của developer

Đây là luồng thường ngày khi bạn đóng góp một tính năng hay bản sửa lỗi.

```bash
# 1. Cập nhật develop mới nhất và tách nhánh feature từ đó
git checkout develop
git pull
git checkout -b feature/ten-viec

# 2. Làm việc, commit theo từng bước nhỏ, có ý nghĩa
git add -p
git commit -m "feat(plugin): ..."

# 3. Push nhánh feature của bạn
git push -u origin feature/ten-viec

# 4. Mở PR nhắm vào develop (KHÔNG phải main)
gh pr create --base develop
```

Sau đó **dừng lại**: Lead (Z-SOFT) review và merge PR của bạn vào `develop`. Đừng tự
merge vào `develop` hay `main`.

### Nguyên tắc

- **Base là `develop`.** PR tính năng/sửa lỗi luôn nhắm vào `develop`, không phải `main`.
- **Nhánh nhỏ, tập trung.** Một nhánh cho một việc — dễ review, dễ revert.
- **Đừng tự merge.** Việc merge vào `develop` và release lên `main` do Lead phụ trách.
- **CI phải xanh.** Chạy `pnpm build` / test tại máy trước khi mở PR; CI cũng chạy lại
  trên PR.
- **Đồng bộ hành vi và tài liệu.** Thay đổi hành vi sản phẩm và tài liệu của nó đi cùng
  một PR (xem [Đóng góp tài liệu](/vi/contributing/documentation/)).

## Luồng release (do Lead thực hiện)

Developer thường không cần làm bước này; nêu ở đây để bạn hiểu điểm đến của code.

1. Lead merge `develop` vào `main` qua PR sau khi review.
2. CI trên `main` xanh.
3. Cắt release: gắn tag phiên bản, build image, phát hành.

Nói ngắn gọn: **`feature/*` → `develop` → `main`**. Bạn phụ trách phần đầu tiên; Lead
phụ trách phần còn lại.

## Đặt tên commit

Dùng [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): tóm tắt`.
Các `type` thường gặp: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```
feat(theme-sdk): add archive channel to ThemeContext
fix(plugin-sdk): scope plugin table indexes by tenant_id, site_id
docs(contributing): add gitflow page
```
