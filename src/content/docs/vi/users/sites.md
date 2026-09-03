---
title: Quản lý nhiều website
description: Tạo website, cấu hình tên máy chủ, nhận diện thương hiệu và trạng thái xuất bản.
sidebar:
  order: 3
---

Một hệ thống Z-CMS có thể vận hành nhiều website độc lập. Mỗi website có tên máy chủ (hostname), nội dung, ngôn ngữ, theme, cài đặt và thành viên riêng.

## Xem và chuyển website

Mở **Sites** (Website) để xem tên, mã định danh (slug), trạng thái, tên máy chủ, theme đang hoạt động và nhận diện thương hiệu của từng website. Trước khi thay đổi nội dung, hình ảnh, tệp, plugin hoặc cài đặt, hãy kiểm tra website đang được chọn.

## Tạo website

Chỉ **Owner** (Chủ sở hữu) có quyền tạo website vì tên máy chủ không được trùng với website khác trên toàn hệ thống.

1. Mở **Sites** và tìm phần **New site**.
2. Nhập tên website. Z-CMS sẽ đề xuất slug và cho phép bạn chỉnh sửa.
3. Nhập tên máy chủ không kèm giao thức như `https://`, ví dụ `news.example.com` hoặc `localhost:3100` khi phát triển trên máy cá nhân.
4. Chọn ngôn ngữ mặc định và tạo website.
5. Cấu hình thương hiệu, theme và nội dung trước khi xuất bản.

Website mới được tạo ở trạng thái **Draft**. Khách truy cập chỉ có thể mở website sau khi bạn chọn **Publish**.

## Nhận diện thương hiệu dùng chung giữa các theme

Trong trang chi tiết website, đặt **Primary color** (Màu chủ đạo) và chọn logo từ thư viện. Theme sử dụng thông tin thương hiệu chung của website, nên bạn vẫn giữ được nhận diện cơ bản khi đổi theme. Hãy xem trước logo trên cả nền sáng và nền tối.

## Xuất bản và hủy xuất bản

- **Publish** cho phép `site-runtime` hiển thị website tại tên máy chủ đã cấu hình.
- **Unpublish** đưa website về trạng thái Draft mà không xóa nội dung hay thiết lập.
- Xuất bản website và xuất bản nội dung là hai thao tác riêng. Khách truy cập chỉ xem được nội dung khi cả website và nội dung đó đều đã được xuất bản.

:::caution
Trước khi xuất bản, hãy kiểm tra cấu hình DNS và chứng chỉ TLS, bảo đảm tên máy chủ không chứa đường dẫn và trang chủ hiển thị đúng với theme đang kích hoạt.
:::

## Phân quyền

Viewer, Author và Editor có thể xem thông tin website. Admin có thể cập nhật tên, nhận diện thương hiệu và trạng thái. Chỉ Owner mới có thể tạo hoặc xóa website.
