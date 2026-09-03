---
title: Tổng quan chức năng
description: Các chức năng chính của trang quản trị Z-CMS và hướng dẫn sử dụng tương ứng.
sidebar:
  order: 2
---

Một hệ thống Z-CMS có thể quản lý nhiều website, với dữ liệu và cấu hình được tách biệt theo từng website. Các chức năng hiển thị trong trang quản trị phụ thuộc vào vai trò của tài khoản và website đang được chọn.

| Khu vực | Bạn có thể làm gì | Hướng dẫn |
| --- | --- | --- |
| Sites (Website) | Tạo website, cấu hình tên máy chủ và nhận diện thương hiệu, xuất bản hoặc hủy xuất bản | [Quản lý nhiều website](/vi/users/sites/) |
| Content (Nội dung) | Tạo trang hoặc bài viết, sử dụng khối nội dung, dịch, xem trước và xuất bản | [Nội dung và xuất bản](/vi/users/content/) |
| Media (Thư viện) | Tải lên, tìm kiếm, sắp xếp theo thư mục và sửa văn bản thay thế | [Hình ảnh và tệp](/vi/users/media/) |
| Marketplace | Tìm và cài gói có chữ ký số | [Theme và plugin](/vi/users/extensions/) |
| Appearance (Giao diện) | Kích hoạt theme, điền biểu mẫu cấu hình và tạo dữ liệu mẫu | [Giao diện và cấu hình theme](/vi/users/appearance/) |
| Users / Profile (Người dùng / Hồ sơ) | Mời thành viên, gán vai trò, đổi mật khẩu và bật xác thực hai yếu tố | [Người dùng và bảo mật](/vi/users/users-security/) |
| Settings → Mail (Cài đặt → Email) | Cấu hình SMTP và gửi email kiểm tra | [Email và tác vụ nền](/vi/users/operations/) |
| Jobs (Tác vụ) | Xem và chạy lại tác vụ trong hàng đợi lỗi | [Email và tác vụ nền](/vi/users/operations/) |
| zAI | Quản lý trang và bài viết bằng ngôn ngữ tự nhiên | [Quản lý nội dung với zAI](/vi/users/zai/) |

## Cách xác định phạm vi thay đổi

Các thay đổi về nội dung, hình ảnh, tệp, giao diện, plugin và email áp dụng cho website đang được chọn. Riêng màn hình **Sites** liệt kê tất cả website mà tài khoản được phép truy cập. Nếu không thấy menu hoặc nút thao tác cần dùng, hãy kiểm tra website hiện tại và vai trò của tài khoản trước khi kết luận chức năng bị lỗi.

## Các thành phần xử lý nền

Tiến trình xử lý nền (worker) tạo ảnh ở các kích thước khác nhau, gửi email, cập nhật sơ đồ website (sitemap) và chạy hàm xử lý sự kiện của plugin (hook). Marketplace đồng bộ danh sách gói đã bị thu hồi. Nhật ký kiểm toán ghi lại các sự kiện bảo mật và thao tác quan trọng, bao gồm thao tác qua zAI.
