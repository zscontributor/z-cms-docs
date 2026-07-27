---
title: Bắt đầu với Z-CMS
description: Làm quen với Admin và xuất bản nội dung đầu tiên.
sidebar:
  order: 1
---

Z-CMS Admin là nơi bạn quản lý nội dung, media, theme, plugin và thành viên của website.

:::note[Quy ước về thuật ngữ]
Tài liệu giữ nguyên tên command, API, field trong manifest và label trên giao diện để bạn có thể đối chiếu trực tiếp với sản phẩm. Các thuật ngữ kỹ thuật phổ biến như `plugin`, `theme` và `runtime` cũng được giữ nguyên khi bản dịch có thể gây nhầm lẫn. Phần hướng dẫn còn lại được viết bằng tiếng Việt tự nhiên.
:::

## Đăng nhập

Trên một instance đã triển khai, trang Admin nằm ngay dưới tên miền của website tại `/admin` — ví dụ `https://ten-site-cua-ban.com/admin`. Trong môi trường phát triển local thì Admin chạy trên cổng riêng: mở `http://localhost:3101`. Với dữ liệu mẫu mặc định, đăng nhập bằng email `admin@z-cms.org` và mật khẩu `admin123`. Nếu tài khoản đã bật xác thực hai bước, hãy nhập thêm mã từ ứng dụng xác thực.

## Các bước đầu tiên

1. Kiểm tra tên website, múi giờ và ngôn ngữ trong **Settings**.
2. Mở **Content** và tạo nội dung đầu tiên.
3. Upload hình ảnh lên **Media**.
4. Kiểm tra menu và theme đang được kích hoạt trong **Appearance**.
5. Mời thành viên và gán vai trò phù hợp trong **Users**.

:::tip
Chỉ gán vai trò **Administrator** cho người thực sự cần quản lý toàn bộ website.
:::

## Tiếp theo

- [Xem tổng quan chức năng](/vi/users/features/)
- [Quản lý nhiều website](/vi/users/sites/)
- [Tạo và xuất bản nội dung](/vi/users/content/)
- [Quản lý media](/vi/users/media/)
- [Cài theme và plugin](/vi/users/extensions/)
- [Người dùng, vai trò và bảo mật](/vi/users/users-security/)
