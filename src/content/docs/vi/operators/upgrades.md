---
title: Nâng cấp và quay lại phiên bản trước
description: Nâng cấp Z-CMS an toàn và duy trì khả năng khôi phục phiên bản trước khi cần.
sidebar:
  order: 2
---

Trước khi nâng cấp, đọc ghi chú phát hành, kiểm tra khả năng tương thích của theme và plugin, đồng thời chuẩn bị bản sao lưu đã thử khôi phục thành công. Bảo đảm vẫn có cách quay lại phiên bản trước (rollback) nếu bản mới gặp sự cố.

## Quy trình đề xuất

1. Kiểm thử phiên bản mới bằng bản sao dữ liệu thực tế đã xóa hoặc che thông tin nhạy cảm.
2. Chạy chuyển đổi cấu trúc dữ liệu (migration) và kiểm thử nhanh trên môi trường kiểm thử (staging).
3. Tạm dừng thay đổi cấu trúc dữ liệu nếu quá trình migration yêu cầu.
4. Triển khai các thành phần theo thứ tự trong ghi chú phát hành.
5. Kiểm tra API, hàng đợi, giao diện website và nhật ký kiểm toán.
6. Chỉ xóa tài nguyên của phiên bản cũ khi đã hết thời hạn cần giữ để quay lại.
