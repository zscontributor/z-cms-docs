---
title: Đóng góp tài liệu
description: Viết và kiểm duyệt tài liệu cho Z-CMS.
sidebar:
  order: 2
---

Tài liệu được lưu dưới dạng Markdown/MDX và được kiểm duyệt qua pull request.

## Nguyên tắc viết

- Bắt đầu từ mục tiêu của người đọc.
- Một trang giải quyết một nhiệm vụ hoặc một khái niệm chính.
- Dùng tên menu và label giống giao diện Admin.
- Giữ nguyên tên command, API, field, label giao diện và những thuật ngữ kỹ thuật không có bản dịch rõ nghĩa như `plugin`, `theme` hoặc `runtime`. Các danh từ thông thường như “trường”, “trạng thái”, “tệp”, “xác minh” và “kiểm duyệt” phải được viết bằng tiếng Việt.
- Viết phần giải thích bằng tiếng Việt tự nhiên; không dịch từng từ hoặc giữ nguyên cấu trúc câu của bản tiếng Anh.
- Ví dụ phải chạy được với phiên bản được ghi trong trang.
- Không đưa secret, credential hoặc dữ liệu người dùng thật vào ví dụ.
- Khi thay đổi hành vi sản phẩm, cập nhật tài liệu trong cùng pull request.

## Frontmatter tối thiểu

```yaml
---
title: Tiêu đề rõ ràng
description: Một câu mô tả kết quả người đọc đạt được.
---
```

Giữ cùng đường dẫn tương đối giữa các ngôn ngữ để bộ chuyển ngôn ngữ liên kết đúng các phiên bản của trang.
