---
title: Bảng dữ liệu và màn hình quản trị
description: Khai báo bảng dữ liệu, menu và màn hình quản lý đa ngôn ngữ cho plugin qua manifest.
sidebar:
  order: 4
---

Plugin do Z-CMS cung cấp (first-party) có thể sở hữu bảng quan hệ và bổ sung màn hình quản lý dữ liệu gồm menu bên, danh sách và biểu mẫu tạo hoặc sửa bản ghi. Bạn khai báo bảng và màn hình trong manifest; phần lõi Z-CMS tạo bảng, hiển thị giao diện và kiểm tra quyền. Không cần viết SQL hoặc mã giao diện quản trị riêng. Cơ chế này phù hợp để xây dựng danh bạ nhân sự, CRM, sổ quản lý tài sản hoặc hệ thống tiếp nhận yêu cầu hỗ trợ mà không sửa mã lõi.

:::note[Khi nào cần bảng quan hệ?]
Hãy ưu tiên `ctx.storage`; phần lớn plugin không cần bảng riêng. Chỉ khai báo `database.tables` khi dữ liệu thực sự cần cấu trúc quan hệ để liệt kê, lọc và chỉnh sửa. Quyền tạo bảng chỉ dành cho plugin do Z-CMS cung cấp. Plugin cộng đồng có khối `database` sẽ bị từ chối khi cài đặt và cần dùng `ctx.storage` thay thế.
:::

## Bước 1: Khai báo bảng

Thêm khai báo vào `database.tables`. Phần lõi chuyển định nghĩa này thành lệnh DDL `CREATE TABLE`. Plugin không gửi SQL tự viết; tên bảng và tên cột đều phải qua kiểm tra trước khi được dùng làm định danh trong truy vấn.

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

- **Tên bảng phải có tiền tố riêng của plugin:** `p_` + ID plugin với dấu chấm được thay bằng dấu gạch dưới + `__`. Tên nằm ngoài tiền tố này sẽ bị từ chối; plugin không thể đặt tên bảng là `content`, `users` hoặc tên bảng của plugin khác.
- **Kiểu cột chỉ nhận:** `text`, `integer`, `bigint`, `boolean`, `numeric`, `timestamptz`, `uuid`, `jsonb`.
- **Cột mặc định là `NOT NULL`.** Dùng `"nullable": true` cho cột không bắt buộc hoặc khai báo `"default"` bằng giá trị cố định; cột `timestamptz` còn hỗ trợ `"now()"`.
- **Năm cột do phần lõi quản lý:** `id`, `tenant_id`, `site_id`, `created_at`, `updated_at`. Không khai báo lại các cột này, nhưng có thể tạo chỉ mục cho chúng, đặc biệt là `site_id`. PostgreSQL Row-Level Security tách biệt dữ liệu của từng tổ chức (tenant).

Khi chạy, plugin truy cập bản ghi qua [`ctx.db`](/vi/developers/plugin-handbook/runtime-api/#ctxdb--các-bảng-của-riêng-plugin). Mọi truy vấn đều bị giới hạn trong website và tổ chức hiện tại.

## Bước 2: Khai báo quyền cho màn hình quản trị

Màn hình riêng của plugin dùng các quyền do plugin định nghĩa trong `permissionsProvided`, không tự dùng quyền của màn hình lõi. Trường `defaultRoles` xác định các vai trò được cấp từng quyền khi plugin hoạt động.

```json
{
  "permissionsProvided": [
    { "key": "crm:read", "description": "See the customer list.", "defaultRoles": ["EDITOR", "ADMIN", "OWNER"] },
    { "key": "crm:manage", "description": "Add, edit and remove customers.", "defaultRoles": ["ADMIN", "OWNER"] }
  ]
}
```

Plugin do Z-CMS cung cấp có thể định nghĩa khóa quyền trực tiếp như `crm:read`. Khóa quyền của plugin cộng đồng phải có không gian tên riêng, theo dạng `x:<slug>:…`. Đây là các quyền plugin cung cấp, khác với `permissions` — các quyền nền tảng mà plugin yêu cầu sử dụng. Xem [Quyền của plugin](/vi/developers/plugin-handbook/permissions/).

## Bước 3: Thêm menu và màn hình

Khối `admin` khai báo mục menu bên (`nav`) và tài nguyên quản lý (`resources`). Mỗi tài nguyên gồm danh sách và biểu mẫu gắn với một bảng. Phần lõi hiển thị các màn hình này và kiểm soát truy cập theo quyền đã khai báo.

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

Mọi cột được tham chiếu trong `nav`, `list` hoặc `form` phải tồn tại trong bảng tương ứng. Mọi quyền được dùng phải do plugin cung cấp. Hệ thống kiểm tra các tham chiếu khi cài đặt và từ chối khai báo không hợp lệ. Nếu tài nguyên không khai báo quyền `write`, mọi người dùng chỉ có thể xem.

### Kiểu trường nhập liệu

Kiểu ô nhập được suy ra từ kiểu cột. Bạn cũng có thể chỉ định trực tiếp bằng `input`:

| `input` | Giao diện | Kiểu cột phù hợp |
| --- | --- | --- |
| `text` | Ô nhập một dòng | `text`, `uuid` |
| `textarea` | Ô nhập nhiều dòng | `text` |
| `richtext` | Trình soạn thảo có định dạng, lưu HTML | `text` |
| `number` | Ô nhập số | `integer`, `bigint`, `numeric` |
| `boolean` | Hộp kiểm | `boolean` |
| `date` | Bộ chọn ngày giờ | `timestamptz` |
| `select` | Danh sách chọn từ `options` | `text` |
| `media` | Bộ chọn tệp trong thư viện, lưu ID tệp | `uuid`, `text` |
| `reference` | ID của bản ghi liên quan | `uuid`, `text` |

Trước khi lưu, phần lõi chuyển đổi và kiểm tra giá trị theo kiểu cột. Các lỗi như trường số bắt buộc bị bỏ trống, ngày không hợp lệ hoặc giá trị sai định dạng UUID được trả về bằng thông báo theo ngôn ngữ giao diện, thay vì lỗi cơ sở dữ liệu khó hiểu.

## Bước 4: Dịch các nhãn giao diện

Nhãn menu, tài nguyên, cột, trường hoặc lựa chọn `select` có thể là chuỗi thông thường hoặc đối tượng `{ en, vi, ja }`. Hệ thống chọn bản dịch theo ngôn ngữ của người dùng và dùng tiếng Anh nếu không có bản dịch phù hợp. Vì vậy, đối tượng bản dịch bắt buộc phải có `en`.

```json
{
  "label": { "en": "Customers", "vi": "Khách hàng", "ja": "顧客" }
}
```

Với `select`, chỉ dịch **label**, không dịch **value**. `value` được lưu vào bản ghi nên phải giữ nguyên giữa các ngôn ngữ:

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

Bạn có thể chọn dịch từng nhãn; nhãn dạng chuỗi thông thường vẫn hoạt động như trước.

## Bước 5: Tạo dữ liệu mặc định khi kích hoạt

Dùng `setup` để tạo bản ghi mẫu hoặc dữ liệu mặc định. Hàm này chạy mỗi lần kích hoạt plugin, nên phải bảo đảm chạy lại không tạo dữ liệu trùng. `ctx.db` đã được giới hạn theo website hiện tại; kết quả rỗng nghĩa là website đó chưa có dữ liệu.

```ts
setup: async (ctx) => {
  const table = "p_com_example_plugin_crm__customers";
  const existing = await ctx.db.select(table, { limit: 1 });
  if (existing.length === 0) {
    await ctx.db.insert(table, { name: "First lead", stage: "lead" });
  }
},
```

## Bước 6: Cung cấp danh sách có bộ lọc cho theme

Các màn hình trên dành cho người quản trị. Để hiển thị danh sách sản phẩm, vị trí cửa hàng hoặc tin tuyển dụng trên website công khai, theme cần dữ liệu từ plugin. Theme chỉ tạo HTML trên máy chủ và không kèm JavaScript riêng để truy vấn. Nền tảng hỗ trợ qua truy vấn công khai: plugin trả dữ liệu, còn thành phần tương tác do runtime cung cấp sẽ lấy và hiển thị dữ liệu trong trình duyệt.

Phần tích hợp gồm hai bước, tương tự cách plugin cung cấp [biểu mẫu công khai](/vi/developers/plugin-handbook/permissions/):

**1. Plugin triển khai hàm `query` cho một capability.** Khai báo mã tính năng trong manifest và triển khai hàm có tên cố định là `query`. Hàm nhận điều kiện lọc qua `params`, trả về mảng bản ghi hoặc `{ items }`. Khách truy cập chỉ gọi được hàm công khai này, không thể tùy ý gọi các hàm khác của plugin.

```json
{ "capabilities": ["catalog.search"] }
```

```ts
export default definePlugin({
  manifest: { /* … capabilities: ["catalog.search"] … */ },
  calls: {
    // Reached at /plugin-query/catalog.search?q=serum&stage=active
    query: async ({ params }, ctx) => {
      const where: Record<string, unknown> = {};
      if (params.stage) where.stage = params.stage;                       // equality
      if (params.q) where.title = { op: "contains", value: params.q };    // substring
      const items = await ctx.db.select("p_com_example_plugin_shop__products", {
        where,
        orderBy: { column: "title", direction: "asc" },
        limit: 60,
      });
      return { items };
    },
  },
});
```

`params` chứa các tham số trên URL đã được phần lõi làm sạch và giới hạn thành một tập nhỏ các chuỗi. Hàm xử lý của bạn quyết định tham số nào được dùng làm điều kiện lọc; hệ thống không tự biến mọi tham số thành bộ lọc. `ctx.db` vẫn kiểm tra tên cột và giới hạn bản ghi theo website.

**2. Theme tạo biểu mẫu lọc và mẫu hiển thị bản ghi.** Theme xuất HTML có các thuộc tính `data-zc-*`. Thành phần tương tác của runtime gọi `/plugin-query/<capability>` khi gửi biểu mẫu, hoặc ngay khi nhập nếu có `data-zc-auto`, rồi điền kết quả vào mẫu. Giá trị được chèn dưới dạng văn bản; liên kết chỉ chấp nhận URL HTTP(S) hoặc đường dẫn tương đối. Vì vậy, dữ liệu bản ghi không được diễn giải thành mã HTML.

```html
<form data-zc-query="catalog.search" data-zc-target="#results" data-zc-auto>
  <input name="q" type="search" placeholder="Search…" />
  <select name="stage">
    <option value="">All</option>
    <option value="active">In stock</option>
  </select>
</form>

<ul id="results">
  <template data-zc-query-item>
    <li>
      <a data-zc-href="url"><span data-zc-field="title"></span></a>
      <span data-zc-field="price"></span>
    </li>
  </template>
  <li data-zc-query-empty hidden>No matches.</li>
  <li data-zc-query-error hidden>Could not load results.</li>
</ul>
```

Các thuộc tính cần dùng:

- `data-zc-query="<capability>"` trên `<form>`: các ô nhập có thuộc tính `name` trở thành tham số truy vấn.
- `data-zc-target="#sel"`: chọn vùng hiển thị kết quả; mặc định là phần tử ngay sau biểu mẫu. `data-zc-auto` tải dữ liệu khi người dùng nhập; `data-zc-initial` tải một lần khi trang mở.
- `<template data-zc-query-item>`: mẫu cho một bản ghi. `data-zc-field="col"` điền giá trị cột dưới dạng văn bản; `data-zc-href="col"` gán liên kết sau khi kiểm tra URL.
- `[data-zc-query-empty]` và `[data-zc-query-error]`: các phần tử tùy chọn, hiển thị khi không có kết quả hoặc khi tải dữ liệu thất bại.

Nếu trình duyệt không chạy JavaScript, người dùng vẫn thấy HTML mà theme đã tạo trên máy chủ, chẳng hạn danh sách chưa lọc. Thành phần tương tác bổ sung khả năng lọc và cập nhật kết quả trực tiếp. Điểm truy cập này chỉ cho phép đọc và giới hạn tần suất theo địa chỉ IP.

:::caution[Truy vấn công khai không yêu cầu đăng nhập]
Bất kỳ dữ liệu nào hàm `query` trả về đều có thể được khách chưa đăng nhập đọc. Chỉ trả về các trường được phép công khai; không trả về giá vốn, email cá nhân hoặc ghi chú nội bộ. Danh sách phục vụ quản trị, như màn hình khách hàng ở trên, không nên được cung cấp qua truy vấn công khai.
:::

## Các quy tắc do nền tảng thực thi

- Tên bảng phải có tiền tố riêng của plugin; phần lõi tạo DDL, plugin không tự viết SQL.
- Cột được tham chiếu trong `nav`/`list`/`form` phải tồn tại; quyền được tham chiếu phải do plugin cung cấp.
- Mọi thao tác đọc và ghi đều bị giới hạn theo tổ chức và website hiện tại, thông qua token và PostgreSQL RLS.
- Dữ liệu gửi từ biểu mẫu được chuyển kiểu và kiểm tra trước khi lưu.

Mã nguồn Z-CMS có hai plugin mẫu hoàn chỉnh: **Customers (CRM)** (`plugins/crm`) minh họa bảng dữ liệu và màn hình quản trị; **Product Catalog** (`plugins/catalog`) bổ sung truy vấn công khai `catalog.search` và bộ lọc danh sách sản phẩm được mô tả ở Bước 6.
