---
title: Đóng góp tài liệu
description: Viết và kiểm duyệt tài liệu cho Z-CMS.
sidebar:
  order: 2
---

Tài liệu được viết bằng Markdown hoặc MDX và được rà soát qua yêu cầu hợp nhất mã (pull request, viết tắt là PR).

## Nguyên tắc viết

- Bắt đầu từ mục tiêu của người đọc; mỗi trang tập trung vào một nhiệm vụ hoặc khái niệm chính.
- Dùng đúng tên menu và nút trên giao diện. Giữ nhãn gốc để dễ đối chiếu, kèm giải thích tiếng Việt khi cần.
- Giữ nguyên tên lệnh, API, trường cấu hình, biến môi trường và đường dẫn. Không dịch các định danh nằm trong mã.
- Viết phần giải thích bằng tiếng Việt tự nhiên. Dùng “quyền”, “trường dữ liệu”, “tệp”, “gói cài đặt”, “mã nguồn”, “tác vụ nền” thay cho các từ tiếng Anh tương ứng khi không nhắc tới định danh kỹ thuật.
- Có thể giữ các thuật ngữ quen thuộc như theme, plugin, runtime, nhưng cần giải thích khi xuất hiện lần đầu trong hướng dẫn nhập môn.
- Dùng câu ngắn, nêu rõ ai thực hiện thao tác và kết quả là gì; tránh dịch từng từ hoặc giữ nguyên cấu trúc câu tiếng Anh.
- Ví dụ phải chạy được với phiên bản được ghi trong trang. Không đưa khóa bí mật, thông tin xác thực hoặc dữ liệu người dùng thật vào ví dụ.
- Khi đổi tiêu đề mục, kiểm tra các liên kết có dấu `#` trỏ tới mục đó.
- Khi thay đổi hành vi sản phẩm, cập nhật tài liệu trong cùng PR.

## Phần thông tin đầu trang tối thiểu

```yaml
---
title: Tiêu đề rõ ràng
description: Một câu mô tả kết quả người đọc đạt được.
---
```

Giữ cùng đường dẫn tương đối ở mọi ngôn ngữ để chức năng chuyển ngôn ngữ mở đúng trang tương ứng. Sau khi sửa, chạy `pnpm build` và kiểm tra cả nội dung lẫn liên kết của bản dịch.
