---
title: Giao diện và cấu hình theme
description: Cài đặt, kích hoạt và cấu hình theme cho website hiện tại.
sidebar:
  order: 7
---

Theme quyết định cách website hiển thị với khách truy cập, bao gồm mẫu trang, khối nội dung, vị trí menu, tài nguyên đi kèm và thông tin SEO. Theme được cài ở cấp hệ thống, sau đó được kích hoạt và cấu hình riêng cho từng website.

## Trước khi đổi theme

1. Kiểm tra website đang được chọn trong danh sách chuyển website.
2. Đọc mô tả, phiên bản và khả năng tương thích của theme.
3. Xác nhận theme có mẫu trang phù hợp với các loại nội dung đang dùng.
4. Lưu lại cấu hình hiện tại để có thể khôi phục nếu theme mới gặp lỗi. Với website đã công khai, hãy thử theme mới trên môi trường kiểm thử (staging) trước khi áp dụng cho website chính.

## Cài và kích hoạt

Mở **Appearance** (Giao diện) để xem các theme đã cài và các theme có thể cài từ danh mục. Quyền `theme:install` cho phép cài gói theme; quyền `theme:activate` cho phép đổi theme đang hoạt động. Khi kích hoạt theme, Z-CMS vô hiệu hóa bộ nhớ đệm hiển thị của website để nội dung được tạo lại, nhưng không xóa nội dung đã lưu.

Nếu tác giả cung cấp ghi chú phát hành, thẻ theme sẽ hiển thị mục **Có gì mới** cho phiên bản đã cài. Mở mục này để đọc các thay đổi trước khi chuyển theme hoặc cập nhật.

## Cấu hình theme

Khi theme được kích hoạt, Z-CMS tạo biểu mẫu cấu hình từ JSON Schema của theme. Tùy từng theme, biểu mẫu có thể gồm các trường về màu sắc, kiểu chữ, logo riêng, liên kết mạng xã hội, bố cục, favicon và SEO.

- Để trống logo hoặc màu tùy chỉnh nếu muốn dùng nhận diện thương hiệu chung của website.
- Chọn hình ảnh và tệp từ thư viện thay vì nhập URL tạm thời.
- Sau khi lưu, hãy kiểm tra website trên máy tính và thiết bị di động, bao gồm cả trang chi tiết và trang báo lỗi không tìm thấy (404).

Một số theme có chức năng **Seed demo content** để tạo nội dung mẫu. Chỉ dùng chức năng này trên website mới hoặc môi trường kiểm thử vì nó có thể tạo loại nội dung, trang, bài viết, menu và cấu hình theme.

## Cấu hình SEO do theme quản lý

Theme có thể dùng cấu hình và nhận diện thương hiệu của website để tạo mẫu tiêu đề, biểu tượng, chỉ dẫn cho công cụ tìm kiếm (robots), dữ liệu Open Graph và JSON-LD. Sau khi đổi theme, hãy kiểm tra mã nguồn trang và cách trang hiển thị khi được chia sẻ lên mạng xã hội.

:::note
Nếu nút cài đặt, kích hoạt hoặc biểu mẫu cấu hình bị vô hiệu hóa, có thể tài khoản của bạn chỉ có quyền đọc hoặc website đang chọn không đúng.
:::
