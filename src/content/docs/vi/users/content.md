---
title: Nội dung và xuất bản
description: Tạo, chỉnh sửa, dịch và xuất bản nội dung.
sidebar:
  order: 4
---

Mỗi loại nội dung có một định nghĩa cấu trúc dữ liệu (schema), quy định các trường được phép sử dụng. Trang quản trị tạo biểu mẫu soạn thảo dựa trên cấu trúc đó để dữ liệu được nhập nhất quán.

## Quy trình cơ bản

1. Vào **Content** và chọn loại nội dung.
2. Chọn **Create**.
3. Nhập tiêu đề, phần định danh trong đường dẫn (slug), nội dung và các trường bắt buộc.
4. Lưu **Draft** (Bản nháp) để tiếp tục chỉnh sửa.
5. Dùng **Preview** (Xem trước) để kiểm tra, rồi chọn **Publish** (Xuất bản) khi nội dung đã sẵn sàng.

## Nội dung đa ngôn ngữ

Các phiên bản ngôn ngữ thuộc cùng một nhóm bản dịch, nhưng mỗi phiên bản vẫn có slug, trạng thái và nội dung riêng.

:::caution
Xóa một phiên bản ngôn ngữ không tự động xóa các phiên bản còn lại trong cùng nhóm bản dịch.
:::

## Tìm và lọc nội dung

Danh sách nội dung hỗ trợ tìm kiếm theo từ khóa, lọc theo trạng thái và phân trang. Mỗi dòng hiển thị đường dẫn công khai, thời gian cập nhật gần nhất và tác giả. Với loại nội dung chỉ có một bản ghi, chẳng hạn trang chủ hoặc trang giới thiệu, Z-CMS mở thẳng trình soạn thảo.

## Trạng thái và quyền

- **Draft** (Bản nháp) chỉ hiển thị trong trang quản trị và bản xem trước có kiểm soát truy cập.
- **Published** (Đã xuất bản) có thể hiển thị công khai nếu website cũng đã được xuất bản.
- Vai trò Author cho phép tạo và sửa nội dung trong phạm vi được cấp quyền, nhưng không cho phép xuất bản.
- Vai trò Editor trở lên cho phép xuất bản, hủy xuất bản và xóa nội dung.

Slug là một phần của URL công khai. Trước khi đổi slug của nội dung đã xuất bản, hãy kiểm tra các liên kết nội bộ và tạo chuyển hướng nếu cần.

## Khối nội dung, trường dữ liệu và SEO

Trình soạn thảo có thể gồm các trường theo cấu trúc đã định nghĩa, vùng sắp xếp khối nội dung và các trường SEO. Chỉ sử dụng những khối được cả loại nội dung lẫn theme hỗ trợ. Hãy đặt tiêu đề và mô tả SEO riêng nếu tiêu đề bài viết không phù hợp để hiển thị trong kết quả tìm kiếm.

## Danh sách kiểm tra trước khi xuất bản

- Các trường bắt buộc, slug và ngôn ngữ đã đúng.
- Ảnh có văn bản thay thế; liên kết và nút kêu gọi hành động hoạt động đúng.
- Đã kiểm tra giao diện trên thiết bị di động, thông tin SEO và bản xem trước.
- Liên kết giữa các bản dịch trỏ đúng ngôn ngữ và nội dung còn cập nhật.
