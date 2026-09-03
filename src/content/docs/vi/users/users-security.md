---
title: Người dùng, vai trò và bảo mật tài khoản
description: Mời thành viên, gán vai trò, đổi mật khẩu và bật xác thực hai yếu tố.
sidebar:
  order: 8
---

Z-CMS cấp quyền truy cập theo vai trò thành viên trên từng website. Một người có thể được gán các vai trò khác nhau ở các website khác nhau.

## Vai trò mặc định

| Vai trò | Quyền chính |
| --- | --- |
| Viewer (Người xem) | Xem thông tin website, nội dung, hình ảnh, tệp, theme, plugin và cài đặt |
| Author (Tác giả) | Tạo và sửa nội dung trong phạm vi được cấp quyền; tải lên và cập nhật hình ảnh, tệp |
| Editor (Biên tập viên) | Xuất bản hoặc xóa nội dung, xóa hình ảnh và tệp, quản lý menu |
| Admin (Quản trị viên) | Cấu hình website, loại nội dung, theme, plugin, email và mời người dùng |
| Owner (Chủ sở hữu) | Tạo hoặc xóa website, quản lý người dùng và xem xét các gói bị cách ly |

Mỗi vai trò tương ứng với một tập hợp quyền được định nghĩa sẵn. Ngoài vai trò, hệ thống vẫn kiểm tra quyền truy cập đối với từng tài nguyên. Author không thể xuất bản nội dung, còn Admin không thể tự nâng vai trò của mình thành Owner.

## Mời thành viên

1. Mở **Users** và chọn website cần cấp quyền.
2. Nhập email, sau đó chọn vai trò không cao hơn vai trò của chính bạn.
3. Gửi lời mời và theo dõi trong **Pending invitations**.
4. Người nhận mở liên kết mời, đăng nhập hoặc tạo tài khoản và chấp nhận lời mời tham gia website.

Admin có thể xem và mời thành viên; chỉ Owner có thể đổi vai trò hoặc xóa quyền truy cập của người khác.

## Hồ sơ và mật khẩu

Người dùng đã đăng nhập có thể mở **Profile** (Hồ sơ) để đổi tên, ảnh đại diện và mật khẩu. Địa chỉ email được dùng để đăng nhập; tùy chính sách hệ thống, bạn có thể không được thay đổi địa chỉ này.

## Xác thực hai yếu tố

Trong **Profile**, bật xác thực bằng mã dùng một lần theo thời gian (TOTP), quét mã QR bằng ứng dụng xác thực rồi nhập mã để hoàn tất. Lưu các mã khôi phục ở nơi an toàn, tách biệt với thiết bị dùng để tạo mã xác thực.

:::danger
Mỗi mã khôi phục chỉ dùng được một lần. Không lưu mã trong ghi chú công khai, yêu cầu hỗ trợ hoặc cùng nơi lưu thông tin của tài khoản dùng chung.
:::

Nếu nghi ngờ tài khoản bị xâm nhập, hãy đổi mật khẩu, thu hồi phiên đăng nhập nếu hệ thống hỗ trợ, kiểm tra quyền thành viên và nhờ Admin hoặc Owner xem nhật ký kiểm toán.
