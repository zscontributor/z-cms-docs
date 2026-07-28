---
title: Bảng dữ liệu và màn hình quản trị
description: Cấp cho một plugin bảng riêng, một menu sidebar và các màn hình CRUD — khai báo trong manifest, render bởi core, và bản địa hoá.
sidebar:
  order: 4
---

Một plugin first-party có thể sở hữu các bảng quan hệ và đóng góp một màn hình quản lý đầy đủ — một mục sidebar, một danh sách, và một form tạo/sửa trên dữ liệu của chính nó. Bạn **khai báo** bảng và màn hình trong manifest; core tạo bảng, render màn hình, và thực thi các quyền. Plugin không ship code quản trị nào và không viết SQL nào. Đây là cách một nhà phát triển xây dựng một danh bạ nhân sự, một CRM, một sổ đăng ký tài sản hay một hàng đợi ticket trên Z-CMS mà không đụng tới core.

:::note[Khi nào bạn cần cái này]
Hãy dùng `ctx.storage` trước — hầu hết plugin không bao giờ cần một bảng quan hệ. Chỉ khai báo `database.tables` khi bạn thực sự có dữ liệu mang tính quan hệ cần liệt kê, lọc và chỉnh sửa. Sở hữu bảng là một đặc quyền **first-party**; một plugin cộng đồng sẽ bị từ chối một khối `database` khi cài đặt và dùng `ctx.storage` thay thế.
:::

## Bước 1: Khai báo một bảng

Thêm một mục `database.tables`. Core biến phần mô tả thành DDL `CREATE TABLE` — bạn không bao giờ viết SQL, nên không có chuỗi do plugin chọn nào chạm tới database dưới bất kỳ dạng nào khác ngoài một định danh đã được xác thực.

```json
{
  "database": {
    "tables": [
      {
        "name": "p_com_example_plugin_crm__customers",
        "columns": [
          { "name": "name", "type": "text" },
          { "name": "email", "type": "text", "nullable": true },
          { "name": "stage", "type": "text", "default": "lead" },
          { "name": "deal_value", "type": "numeric", "nullable": true },
          { "name": "notes", "type": "text", "nullable": true },
          { "name": "last_contacted", "type": "timestamptz", "nullable": true },
          { "name": "avatar", "type": "uuid", "nullable": true }
        ],
        "indexes": [
          { "columns": ["email"], "unique": true },
          { "columns": ["stage"] }
        ]
      }
    ]
  }
}
```

Các quy tắc nền tảng thực thi khi cài đặt:

- **Mọi tên bảng bắt đầu bằng prefix của plugin bạn** — `p_` + id của bạn với các dấu chấm thay bằng gạch dưới + `__`. Một bảng ngoài prefix sẽ bị từ chối. Một plugin không thể đặt tên `content`, `users`, hay bảng của một plugin khác.
- **Kiểu cột** là một tập đóng: `text`, `integer`, `bigint`, `boolean`, `numeric`, `timestamptz`, `uuid`, `jsonb`.
- **Cột mặc định là `NOT NULL`.** Đặt `"nullable": true` cho các cột tuỳ chọn, hoặc một `"default"` hằng (một literal, hoặc `"now()"` trên một `timestamptz`).
- **Core sở hữu năm cột trên mọi bảng** — `id`, `tenant_id`, `site_id`, `created_at`, `updated_at`. Bạn không được khai báo chúng, nhưng bạn có thể đánh index chúng (`site_id` đặc biệt). Mọi hàng được cô lập theo từng tenant bằng row-level security của Postgres.

Các hàng được truy cập lúc runtime thông qua [`ctx.db`](/vi/developers/plugin-handbook/runtime-api/#ctxdb--the-plugins-own-tables), thứ giới hạn mọi truy vấn về site và tenant hiện tại.

## Bước 2: Giới thiệu các quyền để bảo vệ màn hình

Màn hình của một plugin không thuộc quyền bảo vệ của core, nên plugin **tự mang theo** các khoá quyền của mình với `permissionsProvided`. `defaultRoles` cho biết vai trò nào nắm giữ mỗi khoá ngay khi plugin đang hoạt động.

```json
{
  "permissionsProvided": [
    { "key": "crm:read", "description": "See the customer list.", "defaultRoles": ["EDITOR", "ADMIN", "OWNER"] },
    { "key": "crm:manage", "description": "Add, edit and remove customers.", "defaultRoles": ["ADMIN", "OWNER"] }
  ]
}
```

Một plugin first-party có thể tạo các khoá trần như `crm:read`; các khoá do một plugin cộng đồng cung cấp phải được đặt namespace (`x:<slug>:…`). Chúng khác với `permissions`, vốn là các scope lõi mà plugin *yêu cầu* — xem [Quyền](/vi/developers/plugin-handbook/permissions/).

## Bước 3: Thêm một menu và các màn hình

Khối `admin` khai báo một mục sidebar (`nav`) và một tài nguyên (`resources`) — một danh sách và một form trên một bảng. Core render cả hai, được kiểm soát bởi các quyền bạn đã nêu tên.

```json
{
  "admin": {
    "nav": [
      { "label": "Customers", "icon": "users", "resource": "customers", "permission": "crm:read" }
    ],
    "resources": [
      {
        "key": "customers",
        "label": "Customers",
        "table": "p_com_example_plugin_crm__customers",
        "list": {
          "columns": [
            { "column": "name", "label": "Name" },
            { "column": "email", "label": "Email" },
            { "column": "stage", "label": "Stage" }
          ],
          "orderBy": { "column": "name", "direction": "asc" }
        },
        "form": {
          "fields": [
            { "column": "name", "label": "Name" },
            { "column": "email", "label": "Email" },
            { "column": "stage", "label": "Stage", "input": "select",
              "options": [
                { "value": "lead", "label": "Lead" },
                { "value": "customer", "label": "Customer" }
              ] },
            { "column": "deal_value", "label": "Deal value", "input": "number" },
            { "column": "last_contacted", "label": "Last contacted", "input": "date" },
            { "column": "notes", "label": "Notes", "input": "textarea" },
            { "column": "avatar", "label": "Avatar", "input": "media" }
          ]
        },
        "permissions": { "read": "crm:read", "write": "crm:manage" }
      }
    ]
  }
}
```

Mỗi cột mà một `nav`, `list` hay `form` nêu tên phải tồn tại trên bảng đứng sau, và mỗi quyền phải là một quyền plugin cung cấp — core xác thực điều này khi cài đặt và từ chối một đóng góp có tham chiếu treo lơ lửng. Một tài nguyên không có quyền `write` là chỉ đọc với mọi người.

### Kiểu input của trường

Input của form được suy ra từ kiểu cột, hoặc bạn có thể đặt tường minh bằng `input`:

| `input` | Render | Tốt cho kiểu cột |
| --- | --- | --- |
| `text` | Input một dòng | `text`, `uuid` |
| `textarea` | Input nhiều dòng | `text` |
| `richtext` | Trình soạn thảo rich-text (lưu HTML) | `text` |
| `number` | Input số | `integer`, `bigint`, `numeric` |
| `boolean` | Checkbox | `boolean` |
| `date` | Bộ chọn ngày-giờ | `timestamptz` |
| `select` | Dropdown của `options` | `text` |
| `media` | Bộ chọn thư viện media (lưu một media id) | `uuid`, `text` |
| `reference` | Id của một hàng liên quan | `uuid`, `text` |

Core ép mỗi giá trị được post về kiểu đã khai báo của cột và xác thực nó trước khi ghi — một số để trống, một ngày sai hay một giá trị không phải UUID sẽ quay lại dưới dạng một lỗi rõ ràng, đã bản địa hoá thay vì một thất bại từ database.

## Bước 4: Bản địa hoá mọi nhãn

Bất kỳ nhãn nào — một `nav`, tài nguyên, cột, trường, hay một lựa chọn select — đều có thể là một chuỗi thuần **hoặc** một map `{ en, vi, ja }`. Core phân giải nó về ngôn ngữ của người đọc (lùi về tiếng Anh), nên một plugin đã cài đặt nói mọi ngôn ngữ mà admin nói. Tiếng Anh (`en`) là bắt buộc trong một map.

```json
{
  "label": { "en": "Customers", "vi": "Khách hàng", "ja": "顧客" }
}
```

Với một `select`, hãy bản địa hoá **label** nhưng không bao giờ bản địa hoá **value** — value là thứ được lưu vào hàng và phải giữ ổn định qua các ngôn ngữ:

```json
{
  "column": "stage",
  "label": { "en": "Stage", "vi": "Giai đoạn", "ja": "ステージ" },
  "input": "select",
  "options": [
    { "value": "lead",     "label": { "en": "Lead", "vi": "Tiềm năng", "ja": "リード" } },
    { "value": "customer", "label": { "en": "Customer", "vi": "Khách hàng", "ja": "顧客" } }
  ]
}
```

Một nhãn dạng chuỗi thuần vẫn hoạt động y như trước — bản địa hoá là tuỳ chọn, theo từng trường.

## Bước 5: Gieo giá trị mặc định khi kích hoạt

Dùng `setup` để gieo các hàng demo hoặc mặc định. Hãy làm nó idempotent — `setup` chạy lại trên mỗi lần kích hoạt, và `ctx.db` đã được giới hạn về site này, nên "rỗng" nghĩa là "site này chưa được gieo dữ liệu".

```ts
setup: async (ctx) => {
  const table = "p_com_example_plugin_crm__customers";
  const existing = await ctx.db.select(table, { limit: 1 });
  if (existing.length === 0) {
    await ctx.db.insert(table, { name: "First lead", stage: "lead" });
  }
},
```

## Những gì core thực thi

- Tên bảng nằm trong prefix của bạn; core phát ra DDL, plugin không bao giờ viết SQL.
- Mọi cột `nav`/`list`/`form` tồn tại trên bảng; mọi quyền là một quyền bạn cung cấp.
- Mỗi hàng được giới hạn về tenant và site hiện tại trên mọi lần đọc và ghi, bởi token và bởi Postgres RLS.
- Các giá trị form được post bị ép kiểu và xác thực đối chiếu với kiểu cột trước khi ghi.

Plugin **Customers (CRM)** đi kèm (`plugins/crm` trong mã nguồn Z-CMS) là một ví dụ hoàn chỉnh, hoạt động được của mọi thứ trên trang này.
