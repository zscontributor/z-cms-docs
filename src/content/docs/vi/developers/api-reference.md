---
title: Tham chiếu API
description: Sử dụng tài liệu OpenAPI do Z-CMS tạo tự động.
sidebar:
  order: 5
---

Z-CMS tự động tạo tài liệu OpenAPI từ các route của `cms-api`.

Khi chạy trên máy cá nhân, bạn có thể mở giao diện tài liệu API tương tác tại:

```text
http://localhost:4100/api/v1/docs
```

Để xuất OpenAPI JSON:

```bash
pnpm openapi
```

Tài liệu API được tạo tự động là nguồn tham chiếu chính cho các điểm truy cập (endpoint), cấu trúc yêu cầu và cấu trúc phản hồi. Các hướng dẫn khác giải thích khi nào nên dùng API và những giới hạn truy cập cần tuân thủ.
