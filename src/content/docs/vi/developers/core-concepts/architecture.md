---
title: Tổng quan kiến trúc
description: Các thành phần chính của Z-CMS và ranh giới bảo mật giữa chúng.
sidebar:
  order: 1
---

Z-CMS tách API, thành phần hiển thị website công khai, trang quản trị, môi trường thực thi plugin và bộ xử lý nền thành các tiến trình độc lập.

## Các thành phần

| Thành phần | Trách nhiệm |
| --- | --- |
| `cms-api` | Xác thực, phân quyền theo vai trò (RBAC), quản lý nội dung, hình ảnh và tệp, Marketplace và API phục vụ hiển thị |
| `site-runtime` | Hiển thị website công khai bằng theme đang được kích hoạt |
| `admin-web` | Cung cấp giao diện quản trị |
| `plugin-runtime` | Chạy plugin trong vùng thực thi V8 cô lập, không giữ thông tin xác thực |
| `worker` | Xử lý ảnh, gửi email, cập nhật sơ đồ website và chạy tác vụ nền |

## Ranh giới bảo mật

- PostgreSQL Row-Level Security bảo đảm dữ liệu của từng tổ chức (tenant) được tách biệt.
- Plugin chạy trong tiến trình riêng, không chạy bên trong tiến trình API.
- Gói cài đặt phải có chữ ký của nhà phát hành, được Marketplace kiểm duyệt và ký thêm. Khi cài đặt, Z-CMS xác minh cả hai chữ ký và giá trị kiểm tra toàn vẹn (checksum) để phát hiện nội dung bị thay đổi sau khi ký.

Đây là các yêu cầu bắt buộc do nền tảng thực thi, không phải quy ước mà tiện ích mở rộng có thể bỏ qua.
