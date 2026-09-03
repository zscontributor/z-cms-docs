---
title: Bắt đầu với Z-CMS
description: Làm quen với trang quản trị và xuất bản nội dung đầu tiên.
sidebar:
  order: 1
---

Z-CMS Admin là trang quản trị dùng để quản lý nội dung, thư viện hình ảnh và tệp, giao diện, plugin và thành viên của website.

:::note[Quy ước về thuật ngữ]
Tên lệnh, API, trường cấu hình và nhãn giao diện được giữ nguyên để bạn dễ đối chiếu với sản phẩm. Trong tài liệu, **theme** là gói giao diện, **plugin** là tiện ích bổ sung chức năng, còn **runtime** là thành phần thực thi. Khi nhắc đến màn hình hoặc nút bấm, tài liệu dùng tên tiếng Anh kèm giải thích tiếng Việt khi cần.
:::

## Đăng nhập

Với hệ thống đã triển khai, mở đường dẫn `/admin` trên tên miền của website, ví dụ `https://ten-site-cua-ban.com/admin`. Khi phát triển trên máy cá nhân, trang quản trị chạy ở cổng riêng tại `http://localhost:3101`. Nếu đang dùng dữ liệu mẫu mặc định, bạn có thể đăng nhập bằng email `admin@z-cms.org` và mật khẩu `admin123`. Nếu tài khoản đã bật xác thực hai yếu tố, hãy nhập thêm mã từ ứng dụng xác thực.

## Các bước đầu tiên

1. Kiểm tra tên website, múi giờ và ngôn ngữ trong **Settings** (Cài đặt).
2. Mở **Content** (Nội dung) và tạo nội dung đầu tiên.
3. Tải hình ảnh lên **Media** (Thư viện hình ảnh và tệp).
4. Kiểm tra menu và theme đang được kích hoạt trong **Appearance** (Giao diện).
5. Mời thành viên trong **Users** (Người dùng) và chỉ gán vai trò đủ để họ thực hiện công việc.

:::tip
Chỉ gán vai trò **Administrator** cho người thực sự cần quản lý toàn bộ website.
:::

## Tiếp theo

- [Xem tổng quan chức năng](/vi/users/features/)
- [Quản lý nhiều website](/vi/users/sites/)
- [Tạo và xuất bản nội dung](/vi/users/content/)
- [Quản lý hình ảnh và tệp](/vi/users/media/)
- [Cài theme và plugin](/vi/users/extensions/)
- [Người dùng, vai trò và bảo mật](/vi/users/users-security/)
