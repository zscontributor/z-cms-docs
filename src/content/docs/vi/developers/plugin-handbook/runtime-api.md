---
title: API thực thi của plugin
description: Các hàm xử lý sự kiện, API trên đối tượng ctx và quyền cần thiết để plugin sử dụng chúng.
sidebar:
  order: 3
---

Plugin xuất một đối tượng được tạo bằng `definePlugin` từ `@zcmsorg/plugin-sdk`. Các hàm xử lý sự kiện (hook) xác định lúc nào plugin chạy; các phương thức trên đối tượng `ctx` xác định những tài nguyên plugin được sử dụng. Sandbox không cung cấp API hệ thống tệp, `process.env`, kết nối cơ sở dữ liệu hay `fetch`. Plugin chỉ có thể thực hiện các thao tác được hỗ trợ qua những hook và phương thức `ctx` dưới đây.

Mọi phương thức `ctx` đều bất đồng bộ (`async`). Đây là các lời gọi RPC tới tiến trình chủ, không phải thao tác chạy trực tiếp trong vùng thực thi cô lập của plugin. Tiến trình chủ kiểm tra lại quyền ở mỗi lần gọi. Ví dụ, nếu plugin chưa được cấp `content:read`, lời gọi sẽ bị từ chối ở phía chủ; plugin không thể sửa mã kiểm tra cục bộ để vượt qua giới hạn này.

## Đối tượng plugin

`definePlugin` nhận một `manifest` (xem [Tạo plugin đầu tiên](/vi/developers/plugin-handbook/getting-started/)) và bất kỳ hook tùy chọn nào sau đây:

| Hook | Kiểu | Khi nào chạy | Giới hạn thực thi |
| --- | --- | --- | --- |
| `setup(ctx)` | `() => void` | Mỗi lần kích hoạt plugin trên một website; dùng để chuyển đổi dữ liệu, tạo dữ liệu mẫu hoặc cấu hình mặc định. | — |
| `teardown(ctx)` | `() => void` | Mỗi lần vô hiệu hóa. Nếu phát sinh ngoại lệ, hệ thống ghi nhật ký và vẫn tiếp tục chuyển trạng thái. Đây không phải bước gỡ cài đặt. | — |
| `actions` | `{ [event]: (payload, ctx) => void }` | Xử lý sau khi sự kiện xảy ra; CMS không chờ kết quả. | Bất đồng bộ |
| `filters` | `{ [name]: (value, context, ctx) => value }` | Biến đổi giá trị trong luồng xử lý; bên gọi chờ kết quả. Nếu quá thời gian cho phép, hệ thống bỏ qua bộ lọc và dùng giá trị gốc. | Giới hạn thời gian cố định |
| `jobs` | `{ [name]: (payload, ctx) => void }` | Chạy tác vụ đã được đưa vào hàng đợi bằng `ctx.jobs.enqueue(name, payload)`, tách khỏi luồng xử lý yêu cầu web. | 30 giây |
| `calls` | `{ [name]: (payload, ctx) => unknown }` | Xử lý lời gọi và trả kết quả cho CMS. Được gọi qua mã tính năng (capability), không qua mã plugin. | 30 giây |

```ts
import { definePlugin } from "@zcmsorg/plugin-sdk";

export default definePlugin({
  manifest: {
    id: "com.example.plugin.hello",
    name: "Hello Plugin",
    version: "0.1.0",
    author: { name: "Example Studio" },
    engine: ">=0.1.0",
    permissions: ["content:read"],
  },

  setup: async (ctx) => {
    ctx.log.info(`Activated on ${ctx.site.name}`);
  },

  actions: {
    "content.published": async (event, ctx) => {
      await ctx.storage.set(`last-published`, event.contentId);
    },
  },
});
```

:::caution[Bốn cách xử lý công việc của plugin]
Ngoài các bước khởi tạo và dọn dẹp, plugin chỉ xử lý công việc theo bốn cách: phản hồi sự kiện bằng **action**, biến đổi dữ liệu bằng **filter**, trả kết quả qua **call**, hoặc lên lịch tác vụ nền bằng **job**. Plugin không thể tự đặt bộ hẹn giờ, mở kết nối hay chạy mã độc lập với nền tảng.
:::

## Các sự kiện và bộ lọc được hỗ trợ

### Actions — xử lý sau sự kiện, không chờ kết quả

| Sự kiện | Dữ liệu truyền vào |
| --- | --- |
| `content.created` | `siteId, contentId, contentType, title` |
| `content.updated` | `siteId, contentId, contentType, title` |
| `content.published` | `siteId, contentId, contentType, title, path, publishedAt` |
| `content.unpublished` | `siteId, contentId, contentType` |
| `content.deleted` | `siteId, contentId` |
| `theme.activated` | `siteId, themeKey` |
| `plugin.activated` | `siteId, pluginId` |
| `mail.sent` | `siteId, pluginKey, to[], subject, messageId, sentAt` — thông báo cho mỗi lần gửi email trên website, không kèm nội dung thư. |
| `mail.failed` | `siteId, pluginKey, to[], subject, error, failedAt` |

### Filters — biến đổi dữ liệu, có chờ kết quả và giới hạn thời gian

| Bộ lọc | Giá trị | Ngữ cảnh |
| --- | --- | --- |
| `content.seo` | `{ title?, description?, ogImage?, noindex?, canonical? }` — thông tin SEO của trang, ngay trước khi theme hiển thị. | `siteId, contentId, path, title` |
| `mail.sending` | `{ subject, text?, html?, replyTo?, send }` — email ngay trước khi gửi qua SMTP. Trả về `send: false` để hủy gửi. | `siteId, pluginKey, to[]` |

## Đối tượng `ctx`

| Thuộc tính | Chức năng | Quyền hoặc điều kiện cần có |
| --- | --- | --- |
| `ctx.settings` | Cấu hình plugin cho website hiện tại, kết hợp với giá trị mặc định từ `settingsSchema`. | — |
| `ctx.secrets` | `{ placeholder: boolean }` cho biết quản trị viên đã điền những mục nào trong `network.secrets`; không chứa giá trị bí mật. | — |
| `ctx.site` | `{ id, name, locale }` của website hiện tại. | — |
| `ctx.log` | Ghi nhật ký bằng `info / warn / error(message, meta?)`. | — |
| `ctx.storage` | Lưu trữ khóa–giá trị, tách biệt theo từng plugin và website. | — |
| `ctx.db` | Truy cập bảng quan hệ riêng của plugin. | `data:own`, plugin do Z-CMS cung cấp (first-party) và bảng đã khai báo |
| `ctx.content` | Đọc nội dung website. | `content:read` |
| `ctx.jobs` | Đưa tác vụ nền vào hàng đợi. | — |
| `ctx.mail` | Gửi email qua máy chủ thư của website. | `mail:send` |
| `ctx.http` | Gửi yêu cầu tới máy chủ bên ngoài đã khai báo. | `network:fetch` và `network.hosts` |

### `ctx.storage` — kho lưu trữ khóa–giá trị mặc định

```ts
await ctx.storage.set("counter", 3);
const n = await ctx.storage.get<number>("counter"); // 3, or null
await ctx.storage.list("prefix:");                  // [{ key, value }]
await ctx.storage.delete("counter");
```

Hãy ưu tiên `ctx.storage` trước khi tạo bảng quan hệ. Kho lưu trữ này không yêu cầu bổ sung cấu trúc cơ sở dữ liệu và dùng được cho cả plugin cộng đồng lẫn plugin do Z-CMS cung cấp. Dữ liệu được tách biệt theo từng plugin và từng website.

### `ctx.db` — các bảng của riêng plugin

API này chỉ dành cho plugin do Z-CMS cung cấp, đã được cấp `data:own` và khai báo bảng trong `manifest.database`. Plugin không nhận kết nối cơ sở dữ liệu, không tự quản lý giao dịch và không gửi chuỗi SQL. Thay vào đó, plugin chỉ định bảng của mình cùng điều kiện lọc; tiến trình chủ dựng truy vấn có tham số và áp dụng `tenant_id`/`site_id` lấy từ token.

```ts
await ctx.db.insert("p_com_example_plugin_hello__notes", { title: "Hi", body: "…" });
await ctx.db.select("p_com_example_plugin_hello__notes", {
  where: { title: "Hi" },
  orderBy: { column: "created_at", direction: "desc" },
  limit: 20,
});
await ctx.db.update("…__notes", { body: "edited" }, { id });
await ctx.db.delete("…__notes", { id });
```

**Lọc dữ liệu.** Giá trị trực tiếp trong `where`, như `{ stage: "lead" }`, có nghĩa là so sánh bằng. Với phép so sánh khác, dùng `{ column: { op, value } }`. Các toán tử được hỗ trợ là `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `contains`, `startsWith` và `in`. Các điều kiện được kết hợp bằng AND; không hỗ trợ `OR` hoặc SQL thô. Mọi giá trị đều được truyền dưới dạng tham số truy vấn.

```ts
await ctx.db.select("…__customers", {
  where: {
    stage: { op: "in", value: ["lead", "qualified"] },
    name: { op: "contains", value: "an" },   // case-insensitive substring
    deal_value: { op: "gte", value: 100 },
  },
  orderBy: { column: "deal_value", direction: "desc" },
  limit: 50,
});
```

Xem [Bảng dữ liệu và màn hình quản trị](/vi/developers/plugin-handbook/data-and-admin/) để biết cách khai báo bảng, thêm menu quản trị và cung cấp danh sách có bộ lọc cho theme.

### `ctx.content` — đọc nội dung website

```ts
const page = await ctx.content.get(contentId);              // ContentDto | null
const posts = await ctx.content.list({ contentTypeKey: "post", status: "PUBLISHED" });
```

Đối tượng này chỉ hỗ trợ đọc và cần quyền `content:read`; nó không cung cấp phương thức ghi nội dung. Plugin tham gia xử lý nội dung qua `filters` và `actions`, không ghi trực tiếp vào bảng dữ liệu.

### `ctx.jobs` — đưa tác vụ vào hàng đợi

```ts
await ctx.jobs.enqueue("sync-catalog", { since: lastRun });
```

Đây là cách duy nhất để plugin yêu cầu chạy tác vụ sau. Khi hàng đợi xử lý tác vụ, dữ liệu được chuyển cho hàm tương ứng trong `jobs`. Tác vụ vẫn chạy trong sandbox với cùng phạm vi quyền, nhưng tách khỏi yêu cầu web ban đầu. Nền tảng đảm nhiệm việc lưu tác vụ và thử lại khi thất bại.

### `ctx.mail` — gửi email

```ts
await ctx.mail.send({ to: "a@b.co", subject: "Hello", text: "…", replyTo: "me@site" });
```

API cần quyền `mail:send` và không nhận trường `from`, máy chủ SMTP hay thông tin xác thực; địa chỉ gửi được lấy từ cấu hình website. `send` hoàn tất khi email được chấp nhận vào hàng đợi, không phải khi gửi thành công. Kết quả gửi được thông báo sau qua `mail.sent` hoặc `mail.failed`. Hệ thống giới hạn tần suất và ngăn gửi trùng theo từng website.

### `ctx.http` — gọi dịch vụ bên ngoài

```ts
const res = await ctx.http.fetch({
  url: "https://api.deepl.com/v2/translate",
  method: "POST",
  headers: { Authorization: "DeepL-Auth-Key {{secret:deeplKey}}" },
  body: { text: ["Hello"], target_lang: "VI" },
});
const data = JSON.parse(res.body); // body arrives as text
```

API cần quyền `network:fetch` và khối `network` trong manifest để khai báo máy chủ đích. Plugin không thể gọi máy chủ không có trên màn hình phê duyệt quyền. Gateway chặn địa chỉ mạng riêng, loopback và link-local, kể cả sau mỗi lần chuyển hướng. Mỗi yêu cầu bị giới hạn ở 10 giây và 1&nbsp;MB; hạn ngạch theo giờ được áp dụng riêng cho từng website.

:::note[Sử dụng khóa bí mật mà không nhận giá trị khóa]
Các mục khai báo trong `network.secrets` không xuất hiện trong `ctx.settings`. Dùng `{{secret:name}}` tại vị trí cần thông tin xác thực; sau khi kiểm tra máy chủ đích, gateway mới thay bằng giá trị thật ở bên ngoài sandbox. Nhờ đó, ngay cả khi plugin bị xâm nhập, mã trong sandbox cũng không nhận được khóa để đọc hoặc làm lộ trực tiếp.
:::

## Các quyền plugin có thể yêu cầu

`manifest.permissions` liệt kê các quyền cần được quản trị viên phê duyệt. Những quyền thường dùng gồm:

| Quyền | Chức năng được phép sử dụng |
| --- | --- |
| `content:read` | `ctx.content` |
| `content:create` · `content:update` · `content:delete` · `content:publish` | Ghi nội dung qua các API có hỗ trợ thao tác tương ứng. |
| `media:read` · `media:upload` · `media:update` · `media:delete` | Truy cập thư viện hình ảnh và tệp. |
| `mail:send` | `ctx.mail` |
| `network:fetch` | `ctx.http`, kèm khai báo `network`. |
| `data:own` | `ctx.db` và khối `database`, chỉ dành cho plugin do Z-CMS cung cấp. |

`permissions` là các quyền sẵn có của nền tảng mà plugin yêu cầu sử dụng. Ngược lại, `permissionsProvided` là các quyền mới do plugin định nghĩa để kiểm soát màn hình của chính nó. Xem [Bảng dữ liệu và màn hình quản trị](/vi/developers/plugin-handbook/data-and-admin/) và [Quyền của plugin](/vi/developers/plugin-handbook/permissions/).

## Những gì không khả dụng

Plugin không thể dùng `require` hoặc `import` để nạp module khác ngoài `@zcmsorg/plugin-sdk`. Các API `fs`, `process`, `process.env`, `fetch`, `WebSocket`, bộ hẹn giờ (`setTimeout`/`setInterval`) và kết nối trực tiếp tới cơ sở dữ liệu hoặc mạng đều không khả dụng. Hãy gộp mã thành một tệp CommonJS duy nhất và chỉ tương tác với bên ngoài qua `ctx`. Xem [Tạo plugin đầu tiên](/vi/developers/plugin-handbook/getting-started/).
