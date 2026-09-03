---
title: Theme và plugin
description: Cài đặt và quản lý theme, plugin từ Z-CMS Marketplace.
sidebar:
  order: 6
---

Z-CMS phân phối theme và plugin dưới dạng gói cài đặt có chữ ký số. Hệ thống xác minh chữ ký trước khi đưa nội dung gói vào hệ thống.

## Trước khi cài plugin

Hãy kiểm tra nhà phát hành, phiên bản tương thích, lịch sử thay đổi, các quyền mà plugin yêu cầu và chính sách xử lý dữ liệu. Mục **Có gì mới** hiển thị ghi chú do nhà phát hành viết cho từng phiên bản, giúp bạn hiểu các thay đổi trước khi phê duyệt.

## Cài đặt

1. Mở **Marketplace** trong Admin.
2. Chọn plugin hoặc theme.
3. Xem các quyền được yêu cầu và thông tin tương thích.
4. Chọn **Install**.
5. Với plugin, phê duyệt các quyền cần thiết rồi kích hoạt.

:::danger
Không cài gói nhận trực tiếp từ nguồn không tin cậy hoặc không có chữ ký hợp lệ.
:::

## Vòng đời plugin

**Install** (Cài đặt) đưa gói đã xác minh vào hệ thống. **Activate** (Kích hoạt) cho phép plugin chạy trong phạm vi của nó, được giải thích bên dưới. **Deactivate** (Vô hiệu hóa) dừng plugin nhưng không gỡ gói cài đặt. Cấu hình và dữ liệu có thể vẫn còn sau khi vô hiệu hóa; hãy đọc hướng dẫn của plugin trước khi gỡ cài đặt.

## Phạm vi kích hoạt: website và tổ chức

Plugin được phân loại theo cách cung cấp và phạm vi hoạt động:

- **Plugin lõi (Core)** — do Z-CMS cung cấp, cài sẵn trên mọi website nhưng **tắt** cho đến khi quản trị viên bật và phê duyệt quyền.
- **Plugin cho từng website** — cài và kích hoạt riêng tại màn hình **Plugin** của website đó. Đây là phạm vi mặc định.
- **Plugin tổ chức** — bật **một lần cho cả tổ chức** tại màn hình **Plugin tổ chức**, sau đó chạy trên **mọi website** thuộc tổ chức. Trên màn hình Plugin của từng website, plugin loại này hiển thị ở dạng chỉ đọc kèm nhãn "Đã bật cho toàn tổ chức".

Chỉ Administrator hoặc Owner mới được quản lý plugin tổ chức vì thay đổi sẽ ảnh hưởng tới mọi website thuộc tổ chức. Plugin chỉ được cài trong phạm vi khai báo ở trường `scope` của tệp mô tả gói (manifest): không thể cài plugin tổ chức cho riêng một website và ngược lại.

## Phê duyệt quyền

Manifest liệt kê các quyền mà plugin yêu cầu, nhưng Administrator có thể chỉ phê duyệt một phần. Chỉ cấp quyền cần thiết cho các chức năng bạn muốn sử dụng. Hãy xem xét kỹ các quyền `content:update`, `media:delete`, `mail:send` và quyền gửi dữ liệu tới dịch vụ bên ngoài.

## Cập nhật và cách ly

Trước khi cập nhật, hãy đọc lịch sử thay đổi, kiểm tra quyền mới và yêu cầu chuyển đổi dữ liệu. Thành phần thực thi của Z-CMS đồng bộ danh sách thu hồi có chữ ký số và cách ly các gói bị thu hồi. Không kích hoạt lại gói đang bị cách ly; hãy cập nhật lên phiên bản đã sửa hoặc liên hệ nhà phát hành.

Xem [Giao diện và cấu hình theme](/vi/users/appearance/) để biết cách thay đổi và kiểm tra theme.
