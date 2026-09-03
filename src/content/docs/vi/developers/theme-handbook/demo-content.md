---
title: Cung cấp dữ liệu mẫu
description: Khai báo cấu hình, loại nội dung, trang và menu mẫu để quản trị viên tạo từ theme.
sidebar:
  order: 4
---

Theme có thể cung cấp dữ liệu mẫu qua trường `demo` trong `theme.json`. Khi theme đang hoạt động, quản trị viên có quyền `theme:configure` có thể chọn **Appearance → Seed demo** để tạo dữ liệu mẫu.

Dữ liệu mẫu được khai báo trực tiếp trong `theme.json`, không đọc từ tệp `demo.json` riêng. Vì nằm trong manifest, dữ liệu này cũng thuộc gói theme đã ký.

:::caution[Dữ liệu mẫu chỉ dành cho việc dùng thử]
Hãy kiểm tra cả **Seed demo** (tạo dữ liệu mẫu) và **Reseed demo** (tạo lại dữ liệu mẫu) trên website mới hoặc môi trường kiểm thử. Các thao tác này có thể tạo loại nội dung, nội dung đã xuất bản, menu và cấu hình theme. Theme vẫn phải hiển thị được khi chưa có dữ liệu mẫu, với thông báo hoặc bố cục phù hợp cho trạng thái trống.
:::

## Khai báo dữ liệu mẫu

Đối tượng `demo` hỗ trợ bốn phần tùy chọn:

| Trường | Mục đích |
| --- | --- |
| `settings` | Giá trị được kết hợp vào cấu hình hiện tại của theme đang hoạt động. |
| `contentTypes` | Loại nội dung được tạo nếu chưa tồn tại khóa tương ứng. |
| `contents` | Trang, bài viết hoặc nội dung khác thuộc loại đã khai báo. |
| `menus` | Menu và các mục con cần tạo. |

Ví dụ sau tạo trang chủ, một bài viết và menu chính:

```json
{
  "id": "com.example.theme.corporate",
  "name": "Corporate",
  "version": "0.1.0",
  "author": { "name": "Example Studio" },
  "engine": ">=0.1.0",
  "entry": "dist/index.mjs",
  "styles": "dist/theme.css",
  "templates": ["home", "page", "post", "archive", "notFound", "error"],
  "menuLocations": [{ "key": "primary", "name": "Primary menu" }],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "siteTitle": { "type": "string", "title": "Tên website", "default": "" },
      "tagline": { "type": "string", "title": "Khẩu hiệu", "default": "" }
    }
  },
  "demo": {
    "settings": {
      "siteTitle": "Acme Studio",
      "tagline": "Website minh họa"
    },
    "contentTypes": [
      {
        "key": "page",
        "name": "Page",
        "pluralName": "Pages",
        "routePrefix": "",
        "hasBlocks": true,
        "fields": []
      },
      {
        "key": "post",
        "name": "Post",
        "pluralName": "Posts",
        "routePrefix": "blog",
        "hasBlocks": true,
        "fields": []
      }
    ],
    "contents": [
      {
        "contentType": "page",
        "locale": "vi",
        "slug": "",
        "title": "Chào mừng đến Acme Studio",
        "excerpt": "Trang chủ đi kèm dữ liệu demo của theme.",
        "blocks": [
          {
            "id": "demo-home-intro",
            "type": "core/richtext",
            "props": { "html": "<h2>Tạo nên điều rõ ràng.</h2><p>Hãy chỉnh sửa trang này trong Z-CMS Admin.</p>" }
          }
        ],
        "seo": {
          "title": "Acme Studio",
          "description": "Website minh họa được xây dựng bằng Z-CMS."
        },
        "status": "PUBLISHED"
      },
      {
        "contentType": "post",
        "locale": "vi",
        "slug": "xin-chao",
        "title": "Xin chào",
        "data": { "readingTime": 2 },
        "blocks": []
      }
    ],
    "menus": [
      {
        "key": "primary",
        "name": "Menu chính",
        "items": [
          { "label": "Trang chủ", "url": "/" },
          {
            "label": "Blog",
            "url": "/blog",
            "children": [
              { "label": "Xin chào", "url": "/blog/xin-chao" }
            ]
          }
        ]
      }
    ]
  }
}
```

Mỗi mục trong `contents` phải tham chiếu tới một khóa đã khai báo trong `demo.contentTypes`. Hệ thống không tự suy ra loại nội dung từ cấu trúc dữ liệu sẵn có của website.

## Các trường của loại nội dung

Mỗi loại nội dung bắt buộc có `key`, `name` và `pluralName`. Ngoài ra có thể khai báo:

- `description`, `icon` và `fields` dùng cho trình soạn thảo.
- `isSingleton` xác định loại chỉ có một bản ghi; `isRoutable` xác định nội dung có đường dẫn riêng hay không.
- `routePrefix` là tiền tố đường dẫn, chẳng hạn `blog`.
- `hasBlocks` bật trình soạn thảo khối nội dung.

Nếu website đã có loại nội dung cùng khóa, Z-CMS dùng lại loại đó mà không đổi cấu trúc. Vì vậy, dữ liệu mẫu cần tương thích với cả định nghĩa trong theme và loại nội dung đã tồn tại cùng khóa.

## Các trường nội dung và bản dịch

Mỗi mục nội dung bắt buộc có `contentType`, `locale`, `slug` và `title`. Các trường tùy chọn gồm `translationGroup`, `excerpt`, `data`, `blocks`, `seo`, `status` và `publishedAt`.

- `data` chứa giá trị các trường có cấu trúc của loại nội dung.
- `blocks` dùng định dạng khối mà `ctx.renderBlocks()` có thể hiển thị.
- `status` nhận `DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED` hoặc `ARCHIVED`; mặc định là `PUBLISHED`.
- `publishedAt` là chuỗi ngày giờ ISO 8601; nếu bỏ qua, hệ thống dùng thời điểm tạo dữ liệu mẫu.
- Các bản dịch của cùng nội dung phải dùng chung `translationGroup`. Nếu không khai báo, mỗi mục thuộc một nhóm bản dịch riêng.
- Chỉ dùng slug rỗng (`""`) cho trang gốc khi phù hợp với quy tắc đường dẫn của website.

Chỉ dùng các loại khối mà theme hỗ trợ hiển thị; mỗi khối cần có `id` ổn định và duy nhất.

## Menu và thiết lập

Mỗi menu cần `key`, `name` và mảng `items`. Mỗi mục cần `label` và `url`; có thể thêm `target` và các mục con lồng nhau trong `children`. Nếu muốn đặt menu mẫu vào vị trí của theme, khóa menu phải khớp khóa đã khai báo trong `menuLocations`.

Các khóa trong `demo.settings` cũng nên được định nghĩa trong `settingsSchema`. Khi tạo dữ liệu mẫu, hệ thống áp dụng các giá trị này lên cấu hình hiện tại; những mục không liên quan được giữ nguyên.

## Điều gì xảy ra khi tạo lại dữ liệu mẫu?

**Reseed demo** chỉ thay thế nội dung và menu do chính theme đó tạo trước đây. Nội dung thông thường và dữ liệu mẫu của theme khác không bị ảnh hưởng. Các loại nội dung hiện có được giữ lại, còn cấu hình mẫu được áp dụng lại.

Nếu biên tập viên đã chỉnh sửa các bản ghi mẫu, thao tác tạo lại sẽ làm mất những thay đổi đó. Không khuyến nghị **Reseed demo** khi người dùng đã chuyển dữ liệu mẫu thành nội dung thật.

:::note[Quản trị viên phải chủ động tạo dữ liệu mẫu]
Cài đặt hoặc cập nhật theme không tự tạo hay tạo lại dữ liệu mẫu. Nếu bản mới sửa bản dịch, thêm trang hoặc thêm menu mẫu, website đã dùng bản cũ vẫn giữ dữ liệu hiện có cho tới khi quản trị viên chọn **Appearance → Reseed demo** cho theme đang hoạt động. Với website mới cài theme, cần chọn **Seed demo** trước. Hãy ghi rõ trong lịch sử thay đổi rằng muốn nhận dữ liệu mẫu mới, người quản trị phải chủ động tạo lại và cần lưu ý nguy cơ mất các chỉnh sửa trên dữ liệu mẫu.
:::

## Kiểm thử trước khi đóng gói

1. Kích hoạt theme trên website kiểm thử trống và chạy **Seed demo**.
2. Kiểm tra đường dẫn, khối nội dung, menu, cấu hình, SEO và mọi ngôn ngữ.
3. Sửa một nội dung không thuộc dữ liệu mẫu, tạo lại dữ liệu mẫu và xác nhận nội dung đó không đổi.
4. Sửa một bản ghi mẫu rồi tạo lại, kiểm tra việc thay thế và bảo đảm người dùng được cảnh báo rõ.
5. Kiểm thử theme khi không có dữ liệu mẫu để xác nhận giao diện vẫn phù hợp.
6. Biên dịch và đóng gói theme, cài lên website sạch rồi lặp lại kiểm thử tạo dữ liệu mẫu.
