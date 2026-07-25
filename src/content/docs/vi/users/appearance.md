---
title: Giao diện và cấu hình theme
description: Cài đặt, kích hoạt và cấu hình theme cho website hiện tại.
sidebar:
  order: 7
---

Theme định nghĩa mẫu giao diện, khối nội dung, vị trí menu, tài nguyên và siêu dữ liệu SEO của website công khai. Theme được cài ở cấp hệ thống, sau đó được kích hoạt và cấu hình riêng cho từng website.

## Trước khi đổi theme

1. Kiểm tra website hiện tại trong bộ chuyển website.
2. Đọc mô tả, phiên bản và khả năng tương thích của theme.
3. Xác nhận theme có template cho các loại nội dung đang dùng.
4. Lưu lại cấu hình theme hiện tại để có thể khôi phục nếu theme mới gặp lỗi. Với website đang hoạt động công khai, hãy thử theme mới trên một website staging trước khi áp dụng cho website chính.

## Cài và kích hoạt

Mở **Appearance** để xem các theme đã cài và những theme có thể cài từ danh mục. Permission `theme:install` cho phép cài package; `theme:activate` cho phép đổi theme đang hoạt động. Khi kích hoạt theme, Z-CMS làm mới bộ nhớ đệm hiển thị của website nhưng không xóa nội dung.

Mỗi thẻ theme hiển thị mục **Có gì mới** nếu tác giả có kèm — ghi chú phát hành của phiên bản đang cài. Mở rộng mục này để xem phiên bản đã thay đổi những gì trước khi bạn chuyển sang hoặc cập nhật.

## Cấu hình theme

Khi theme được kích hoạt, Z-CMS tạo biểu mẫu cấu hình từ JSON Schema của theme. Tùy từng theme, biểu mẫu có thể gồm các trường về màu sắc, kiểu chữ, logo riêng, liên kết mạng xã hội, bố cục, favicon và SEO.

- Để trống logo hoặc màu tùy chỉnh nếu muốn dùng nhận diện thương hiệu chung của website.
- Dùng Media Library để chọn tài nguyên thay vì nhập URL tạm thời.
- Sau khi lưu, hãy mở website công khai và kiểm tra giao diện trên desktop, mobile, trang chi tiết và trang 404.

Một số theme cung cấp chức năng **Seed demo content**. Chỉ dùng chức năng này trên website mới hoặc môi trường staging vì nó có thể tạo loại nội dung, trang, bài viết, menu và thiết lập theme.

## SEO thuộc về theme

Theme có thể tạo mẫu tiêu đề, biểu tượng, chính sách robots, Open Graph và JSON-LD từ cấu hình theme và nhận diện thương hiệu của website. Sau khi đổi theme, hãy kiểm tra mã nguồn trang và bản xem trước khi chia sẻ lên mạng xã hội.

:::note
Nếu nút cài đặt, kích hoạt hoặc biểu mẫu cấu hình bị vô hiệu hóa, có thể tài khoản của bạn chỉ có quyền đọc hoặc website đang chọn không đúng.
:::
