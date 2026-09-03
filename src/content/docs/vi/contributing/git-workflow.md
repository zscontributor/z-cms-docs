---
title: Quy trình Git (Gitflow)
description: Làm việc trên nhánh feature, gửi pull request vào develop và phát hành từ main.
sidebar:
  order: 1
---

Z-CMS dùng phiên bản rút gọn của Gitflow, gồm hai nhánh lâu dài và hai loại nhánh tạm thời. Mọi thay đổi được đưa vào sản phẩm qua **pull request (PR)**, không đẩy trực tiếp lên nhánh chung.

## Các nhánh

| Nhánh | Đẩy trực tiếp | Hợp nhất PR | Mục đích |
| --- | --- | --- | --- |
| `main` | Không | Chỉ sau khi được rà soát | Phát hành |
| `develop` | Không, trừ trưởng nhóm khi cần | Qua PR | Tích hợp thay đổi |
| `feature/*` | Chủ nhánh được phép | Không bắt buộc | Phát triển tính năng hoặc sửa lỗi |
| `hotfix/*` | Chỉ người được cấp quyền | Theo quy trình | Sửa lỗi khẩn cấp |

- **`main`:** luôn giữ ở trạng thái có thể phát hành. Chỉ nhận thay đổi đã được rà soát từ `develop` hoặc `hotfix/*`; bản phát hành và nhãn phiên bản được tạo từ đây.
- **`develop`:** nơi tích hợp thay đổi. Các nhánh `feature/*` gửi PR vào nhánh này; chỉ trưởng nhóm được đẩy trực tiếp khi cần.
- **`feature/*`:** nhánh làm việc của bạn. Đặt tên theo công việc, chẳng hạn `feature/plugin-webhooks` hoặc `feature/theme-dark-mode`.
- **`hotfix/*`:** sửa khẩn cấp cho phiên bản đã phát hành. Chỉ người được phân quyền tạo và hợp nhất vào `main`, sau đó đưa thay đổi trở lại `develop` theo quy trình.

## Quy trình dành cho lập trình viên

Khi đóng góp tính năng hoặc sửa lỗi, thực hiện các bước sau:

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

Sau khi mở PR, chờ trưởng nhóm Z-SOFT rà soát và hợp nhất vào `develop`. Không tự hợp nhất vào `develop` hoặc `main`.

### Nguyên tắc

- **Chọn nhánh đích là `develop`.** PR tính năng và sửa lỗi không nhắm trực tiếp vào `main`.
- **Mỗi nhánh tập trung một việc.** Thay đổi nhỏ giúp dễ rà soát và hoàn tác.
- **Không tự hợp nhất vào nhánh chung.** Trưởng nhóm phụ trách hợp nhất vào `develop` và phát hành qua `main`.
- **Các kiểm tra phải thành công.** Chạy `pnpm build` và kiểm thử trên máy trước khi mở PR; CI sẽ kiểm tra lại trên PR.
- **Cập nhật tài liệu cùng thay đổi sản phẩm.** Xem [Đóng góp tài liệu](/vi/contributing/documentation/).

## Quy trình phát hành do trưởng nhóm thực hiện

Lập trình viên thường không cần thực hiện phần này; đây là các bước sau khi thay đổi của bạn đã được tích hợp.

1. Trưởng nhóm hợp nhất `develop` vào `main` qua PR đã được rà soát.
2. Xác nhận CI trên `main` hoàn tất thành công.
3. Tạo nhãn phiên bản, biên dịch image và phát hành.

Tóm lại: **`feature/*` → `develop` → `main`**. Bạn chuẩn bị thay đổi và gửi PR vào `develop`; trưởng nhóm phụ trách hợp nhất và phát hành.

## Đặt tên commit

Dùng [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): tóm tắt`.
Các `type` thường gặp: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

```
feat(theme-sdk): add archive channel to ThemeContext
fix(plugin-sdk): scope plugin table indexes by tenant_id, site_id
docs(contributing): add gitflow page
```
