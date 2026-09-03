---
title: Email và tác vụ nền
description: Cấu hình SMTP, gửi email kiểm tra và xử lý tác vụ nền bị lỗi.
sidebar:
  order: 9
---

Z-CMS dùng tiến trình xử lý nền (worker) để gửi email, tạo các kích thước ảnh, cập nhật sơ đồ website và chạy một số hàm xử lý sự kiện của plugin. Nhờ đó, các yêu cầu web không phải chờ những tác vụ tốn thời gian này hoàn tất.

## Cấu hình email cho từng website

Mở **Settings → Mail**. Các trường thường gồm máy chủ SMTP, cổng, chế độ mã hóa, tên đăng nhập, mật khẩu, tên người gửi và địa chỉ người gửi. Cấu hình được lưu theo website, vì vậy hãy chọn đúng website trước khi chỉnh sửa.

1. Nhập thông tin kết nối và xác thực do nhà cung cấp email cung cấp.
2. Lưu cấu hình.
3. Chọn **Send test email** để gửi email kiểm tra đến địa chỉ bạn có thể truy cập.
4. Kiểm tra hộp thư đến, thư rác và nhật ký của nhà cung cấp.

Quyền `settings:read` cho phép xem cấu hình; `settings:update` cho phép chỉnh sửa; `mail:send` cho phép gửi email và được cấp riêng. Trang này cũng liệt kê các plugin được cấp `mail:send`, giúp bạn biết plugin nào có thể dùng thông tin người gửi của website để gửi email.

:::caution
Không đưa mật khẩu SMTP vào yêu cầu hỗ trợ hoặc ảnh chụp màn hình. Sau khi thay thông tin xác thực, hãy gửi lại email kiểm tra ngay.
:::

## Hàng đợi tác vụ lỗi

Mở **Jobs** (Tác vụ) để xem hàng đợi tác vụ lỗi (dead-letter queue). Mỗi mục là một tác vụ vẫn thất bại sau khi đã dùng hết số lần thử cho phép, chẳng hạn gửi email, xử lý ảnh, cập nhật sơ đồ website hoặc chạy hàm xử lý sự kiện của plugin.

Khi xử lý lỗi:

1. Đọc tên tác vụ, thời gian, số lần thử và thông báo lỗi.
2. Khắc phục nguyên nhân, chẳng hạn cấu hình SMTP sai, thiếu quyền truy cập bộ lưu trữ hoặc plugin bị lỗi.
3. Chọn chạy lại sau khi nguyên nhân đã được xử lý.
4. Xác nhận tác vụ biến mất khỏi danh sách và kết quả đầu ra đã được tạo.

Trang hiển thị tối đa 50 mục. Nếu có cảnh báo danh sách đã bị rút gọn, hãy xử lý lần lượt theo từng nhóm. Chạy lại liên tục khi chưa sửa nguyên nhân có thể làm tăng tải và gửi email trùng lặp.
