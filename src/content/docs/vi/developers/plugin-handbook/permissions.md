---
title: Quyền của plugin
description: Cách khai báo, phê duyệt và thực thi quyền truy cập của plugin.
sidebar:
  order: 2
---

Plugin khai báo các quyền cần dùng trong manifest, nhưng chỉ được sử dụng sau khi Administrator phê duyệt. Thành phần thực thi nhận token ngắn hạn, giới hạn theo quyền đã cấp. CMS gateway kiểm tra lại quyền trong token trước mỗi lần cho phép truy cập tài nguyên.

## Nguyên tắc

- Chỉ yêu cầu những quyền cần thiết cho chức năng hiện tại.
- Xử lý an toàn khi quản trị viên chỉ phê duyệt một phần các quyền đã yêu cầu.
- Không lưu token vào kho dữ liệu hoặc nhật ký.
- Ghi rõ trong ghi chú phát hành mọi thay đổi yêu cầu thêm quyền.

Việc kiểm tra quyền không chỉ diễn ra trên giao diện. CMS còn thực thi kiểm soát quyền tại ranh giới giữa plugin và nền tảng.
