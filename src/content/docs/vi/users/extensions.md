---
title: Theme và plugin
description: Cài và quản lý extension từ Z-CMS Marketplace.
sidebar:
  order: 6
---

Z-CMS phân phối theme và plugin dưới dạng package đã ký. Hệ thống xác minh chữ ký trước khi import package.

## Trước khi cài plugin

Trước khi cài, hãy kiểm tra nhà phát hành, phiên bản tương thích, lịch sử thay đổi, các permission mà plugin yêu cầu và chính sách xử lý dữ liệu. Lịch sử thay đổi hiển thị dưới dạng mục **Có gì mới** trên mỗi plugin — ghi chú phát hành do nhà phát hành viết cho phiên bản đó, giúp bạn biết phiên bản mới làm gì trước khi phê duyệt.

## Cài đặt

1. Mở **Marketplace** trong Admin.
2. Chọn plugin hoặc theme.
3. Xem các permission được yêu cầu và thông tin tương thích.
4. Chọn **Install**.
5. Với plugin, phê duyệt các permission cần thiết rồi kích hoạt.

:::danger
Không cài package được gửi trực tiếp từ nguồn không tin cậy hoặc package không có chữ ký hợp lệ.
:::

## Vòng đời plugin

**Install** đưa package đã được xác minh vào hệ thống. **Activate** cho phép plugin chạy trên **một website**. **Deactivate** dừng plugin nhưng không xóa package. Cấu hình và dữ liệu của plugin có thể vẫn còn sau khi vô hiệu hóa, vì vậy hãy đọc hướng dẫn gỡ cài đặt trước khi xóa.

## Phạm vi kích hoạt: site và tổ chức

Mỗi plugin thuộc đúng một **tầng kích hoạt**, quyết định nơi nó chạy:

- **Plugin lõi (Core)** — do Z-CMS cung cấp, cài sẵn trên mọi website nhưng **tắt** cho đến khi quản trị viên bật và phê duyệt quyền.
- **Plugin site** — cài và kích hoạt riêng cho từng website tại màn hình **Plugin**. Đây là tầng mặc định.
- **Plugin tổ chức** — bật **một lần cho cả tổ chức** tại màn hình **Plugin tổ chức**, sau đó chạy trên **mọi website** thuộc tổ chức. Trên màn hình Plugin của từng website, plugin loại này hiển thị ở dạng chỉ đọc kèm nhãn "Đã bật cho toàn tổ chức".

Chỉ Administrator hoặc Owner mới quản lý được plugin tổ chức, vì một thay đổi ở đó ảnh hưởng tới mọi website. Một plugin chỉ cài được ở đúng tầng do manifest của nó khai báo (`scope`): không thể cài plugin tổ chức cho riêng một website, và ngược lại.

## Phê duyệt quyền

Manifest liệt kê các permission mà plugin yêu cầu, nhưng Administrator có thể chỉ phê duyệt một phần. Chỉ cấp những khả năng cần thiết cho chức năng bạn muốn bật. Hãy kiểm tra kỹ `content:update`, `media:delete`, `mail:send` và các permission cho phép gửi dữ liệu tới dịch vụ bên ngoài.

## Cập nhật và cách ly

Trước khi cập nhật, hãy đọc lịch sử thay đổi, kiểm tra permission mới và yêu cầu chuyển đổi dữ liệu. Runtime đồng bộ danh sách thu hồi đã ký và cách ly package đã bị thu hồi. Không kích hoạt lại package đang bị cách ly; hãy cập nhật lên phiên bản đã sửa hoặc liên hệ nhà phát hành.

Xem [Giao diện và cấu hình theme](/vi/users/appearance/) để biết cách thay đổi và kiểm tra theme.
