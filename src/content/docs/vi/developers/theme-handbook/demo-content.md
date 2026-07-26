---
title: Cung cấp dữ liệu demo
description: Khai báo thiết lập, loại nội dung, nội dung và menu để quản trị viên có thể seed từ theme.
sidebar:
  order: 4
---

Theme có thể cung cấp một bộ dữ liệu demo tùy chọn trong trường `demo` của `theme.json`. Khi theme đang được kích hoạt, quản trị viên có permission `theme:configure` có thể áp dụng bộ dữ liệu này tại **Appearance → Seed demo**.

Bộ dữ liệu nằm trực tiếp trong `theme.json`; contract manifest hiện tại không đọc từ file `demo.json` riêng. Nhờ nằm trong manifest, dữ liệu demo cũng được đưa vào package theme đã ký.

:::caution[Dữ liệu demo chỉ dành cho việc dùng thử]
Hãy thử cả thao tác seed và reseed trên website mới hoặc môi trường staging. Một lần seed có thể tạo loại nội dung, nội dung đã xuất bản, menu và thiết lập theme. Theme không được phụ thuộc vào dữ liệu demo để hiển thị và vẫn phải có trạng thái trống hữu ích.
:::

## Thêm khai báo demo

Đối tượng `demo` hỗ trợ bốn phần tùy chọn:

| Trường | Mục đích |
| --- | --- |
| `settings` | Các giá trị được merge vào thiết lập hiện tại của theme đang kích hoạt. |
| `contentTypes` | Các loại nội dung sẽ được tạo nếu key tương ứng chưa tồn tại. |
| `contents` | Page, bài viết hoặc nội dung khác gắn với một loại nội dung đã khai báo. |
| `menus` | Menu và các mục menu lồng nhau cần tạo. |

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

Mỗi mục trong `contents` phải tham chiếu đến một key có trong `demo.contentTypes`. Trình seed không tự suy ra loại nội dung từ content model hiện có của website.

## Các trường của loại nội dung

Mỗi loại nội dung bắt buộc có `key`, `name` và `pluralName`. Ngoài ra có thể khai báo:

- `description`, `icon` và `fields` cho trình biên tập.
- `isSingleton` và `isRoutable` để điều khiển hành vi.
- `routePrefix` cho nội dung có route, chẳng hạn `blog`.
- `hasBlocks` để bật trình biên tập block.

Nếu website đã có loại nội dung cùng key, Z-CMS dùng lại loại đó mà không thay đổi schema. Vì vậy dữ liệu demo cần tương thích với cả khai báo trong theme và loại nội dung có thể đã tồn tại dưới cùng key.

## Các trường nội dung và bản dịch

Mỗi mục nội dung bắt buộc có `contentType`, `locale`, `slug` và `title`. Các trường tùy chọn gồm `translationGroup`, `excerpt`, `data`, `blocks`, `seo`, `status` và `publishedAt`.

- `data` chứa giá trị cho các trường có cấu trúc của loại nội dung.
- `blocks` dùng cùng cấu trúc tài liệu block được hiển thị bởi `ctx.renderBlocks()`.
- `status` nhận `DRAFT`, `IN_REVIEW`, `SCHEDULED`, `PUBLISHED` hoặc `ARCHIVED`; mặc định là `PUBLISHED`.
- `publishedAt` là chuỗi ngày giờ ISO 8601. Nếu bỏ qua, hệ thống dùng thời điểm seed.
- Các bản dịch của cùng một nội dung phải dùng chung giá trị `translationGroup`. Nếu không khai báo, mỗi mục sẽ thuộc một nhóm bản dịch riêng.
- Chỉ dùng slug rỗng (`""`) cho trang gốc khi phù hợp với thiết kế route của website.

Chỉ dùng loại block mà theme có thể hiển thị và đặt `id` ổn định, duy nhất cho từng block.

## Menu và thiết lập

Mỗi menu bắt buộc có `key`, `name` và mảng `items`. Mỗi mục cần `label` và `url`; `target` và `children` đệ quy là tùy chọn. Nếu demo dùng menu để điền các vị trí của theme, key của menu phải khớp với key đã khai báo trong `menuLocations`.

Các key trong `demo.settings` cũng nên tồn tại trong `settingsSchema`. Khi seed, hệ thống merge các giá trị này lên trên thiết lập hiện tại của theme; các thiết lập không liên quan vẫn được giữ nguyên.

## Hiểu hành vi reseed

Thao tác **Reseed demo** chỉ thay thế nội dung và menu đã được tạo trước đó bởi chính theme đó. Nội dung thông thường của website và dữ liệu demo thuộc theme khác không bị ảnh hưởng. Các loại nội dung hiện có được giữ lại, còn thiết lập demo được merge lại.

Do biên tập viên có thể đã sửa các bản ghi được seed, hãy xem reseed là thao tác phá hủy đối với dữ liệu demo của theme đó. Không hướng dẫn người dùng reseed sau khi họ đã bắt đầu sửa dữ liệu demo thành nội dung thật.

:::note[Seed luôn là thao tác thủ công của admin]
Việc cài đặt hay cập nhật theme sẽ không tự động seed hoặc reseed dữ liệu demo. Khi bạn phát hành phiên bản mới có thay đổi dữ liệu demo — sửa bản dịch, thêm trang, thêm menu — những website đã seed phiên bản trước vẫn giữ nguyên dữ liệu demo hiện có cho tới khi admin mở **Appearance** và nhấn **Reseed demo** cho theme đang kích hoạt. Với bản cài mới, website không có nội dung demo nào cho tới khi admin nhấn **Seed demo**. Hãy ghi rõ điều này trong lịch sử thay đổi để người vận hành biết cần reseed mới nhận được thay đổi.
:::

## Kiểm thử trước khi đóng gói

1. Kích hoạt theme trên website kiểm thử trống và chạy **Seed demo**.
2. Kiểm tra route, block, menu, thiết lập, SEO và mọi locale.
3. Sửa một nội dung thông thường không thuộc demo, reseed và xác nhận nội dung đó không đổi.
4. Sửa một nội dung được seed, reseed và xác nhận hành vi thay thế đã được truyền đạt rõ ràng.
5. Kiểm thử theme trên website không có dữ liệu demo để xác nhận các trạng thái trống.
6. Build và đóng gói theme, sau đó cài package lên website sạch và lặp lại phép thử seed.
