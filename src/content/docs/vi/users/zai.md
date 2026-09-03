---
title: Quản lý nội dung với zAI
description: Dùng ngôn ngữ tự nhiên để liệt kê, tạo, sửa và xuất bản nội dung.
sidebar:
  order: 10
---

zAI Content Operator cho phép bạn quản lý trang và bài viết bằng ngôn ngữ tự nhiên. zAI chỉ được thực hiện các thao tác mà tài khoản hiện tại có quyền sử dụng. Mọi thao tác đều đi qua Z-CMS API, được kiểm tra quyền và ghi vào nhật ký kiểm toán.

## Tác vụ hỗ trợ

- Liệt kê hoặc tìm trang và bài viết.
- Tạo nội dung mới ở trạng thái bản nháp (Draft).
- Sửa tiêu đề, slug hoặc các trường được hỗ trợ.
- Xuất bản hoặc hủy xuất bản nội dung.
- Xóa nội dung sau bước xác nhận rõ ràng.

## Viết yêu cầu chính xác

Trong yêu cầu, hãy nêu rõ loại nội dung, trạng thái, ngôn ngữ và giá trị cần thay đổi. Ví dụ:

```text
Tạo bản nháp bài viết bằng tiếng Việt, có tiêu đề "Thông báo bảo trì" và slug "thong-bao-bao-tri".
```

```text
Liệt kê các trang đang được xuất bản có từ "dịch vụ" trong tiêu đề.
```

Sau mỗi thao tác, hãy mở **Content** để kiểm tra kết quả, đặc biệt là slug, ngôn ngữ, liên kết nội bộ và các trường SEO.

## Thao tác xóa

Khi bạn yêu cầu xóa, zAI sẽ tạm dừng và hiển thị bước **Xác nhận xóa**. Hãy kiểm tra lại đối tượng trước khi xác nhận. Nếu kết quả tìm kiếm chưa xác định được chính xác một đối tượng, hãy hủy thao tác.

:::caution
Không nhập khóa bí mật, thông tin xác thực hoặc dữ liệu cá nhân nhạy cảm vào hội thoại. zAI hỗ trợ quản lý nội dung nhưng không thay thế quy trình biên tập và kiểm duyệt.
:::

Nếu zAI báo không đủ quyền, hãy dùng tài khoản đã được cấp quyền phù hợp hoặc nhờ người có vai trò Editor/Admin thực hiện. Không cấp thêm quyền rộng hơn mức cần thiết chỉ để hoàn thành một thao tác đơn lẻ.
