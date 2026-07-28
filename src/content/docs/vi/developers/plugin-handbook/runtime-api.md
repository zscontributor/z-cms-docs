---
title: API runtime của plugin
description: Các hook mà một plugin triển khai và các API ctx mà nó có thể gọi, kèm scope mà mỗi cái yêu cầu.
sidebar:
  order: 3
---

Một plugin export một object duy nhất được dựng bằng `definePlugin` từ `@zcmsorg/plugin-sdk`. Mọi thứ nó có thể *làm* là một hook mà nó triển khai; mọi thứ nó có thể *chạm tới* là một method trên object `ctx` được trao cho nó. Bên trong sandbox không có `require`, không có `fs`, không có `process.env`, không có database handle và không có `fetch` — nếu một khả năng không nằm trong các hook hay method `ctx` bên dưới, plugin không thể làm được.

Mọi method `ctx` đều `async`, bởi vì không method nào chạy trong isolate của plugin: chúng là các lời gọi RPC ngược về host, và host kiểm tra lại các scope đã cấp cho plugin trên từng lời gọi. Một plugin chưa từng yêu cầu `content:read` sẽ nhận về từ chối từ host, chứ không phải một kiểm tra cục bộ mà nó có thể vá bỏ.

## Object plugin

`definePlugin` nhận một `manifest` (xem [Xây dựng plugin đầu tiên](/vi/developers/plugin-handbook/getting-started/)) và bất kỳ hook tuỳ chọn nào sau đây:

| Hook | Dạng | Khi nào chạy | Ngân sách |
| --- | --- | --- | --- |
| `setup(ctx)` | `() => void` | Một lần, khi plugin được kích hoạt trên một site — migration, dữ liệu mẫu, giá trị mặc định. | — |
| `teardown(ctx)` | `() => void` | Một lần, khi vô hiệu hoá. Một throw ở đây được ghi log và quá trình chuyển đổi vẫn tiếp tục. Không phải gỡ cài đặt. | — |
| `actions` | `{ [event]: (payload, ctx) => void }` | Bắn-và-quên, **sau khi** có việc gì đó đã xảy ra. CMS không chờ. | async |
| `filters` | `{ [name]: (value, context, ctx) => value }` | Biến đổi một giá trị **đang trên đường truyền**; bên gọi phải chờ. Một filter chạy quá timeout sẽ bị bỏ qua và giá trị gốc được dùng. | giới hạn cứng |
| `jobs` | `{ [name]: (payload, ctx) => void }` | Việc trì hoãn, chạy khi một `ctx.jobs.enqueue(name, payload)` trước đó được xử lý ngoài đường request. | 30s |
| `calls` | `{ [name]: (payload, ctx) => unknown }` | Request/response — CMS gọi một cái và **chờ giá trị nó trả về**. Được tiếp cận theo khả năng, không theo khoá plugin. | 30s |

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

:::caution[Chỉ bốn dạng này mới làm việc]
Một plugin không thể đặt timer, mở kết nối, hay tự chạy code. Nó phản ứng với một **action**, biến đổi một **filter**, trả lời một **call**, hoặc yêu cầu nền tảng chạy một **job** về sau. Đó là toàn bộ luồng điều khiển của một plugin.
:::

## Sự kiện bạn có thể hook

### Actions — bắn sau khi sự việc xảy ra, không bao giờ được await

| Event | Payload |
| --- | --- |
| `content.created` | `siteId, contentId, contentType, title` |
| `content.updated` | `siteId, contentId, contentType, title` |
| `content.published` | `siteId, contentId, contentType, title, path, publishedAt` |
| `content.unpublished` | `siteId, contentId, contentType` |
| `content.deleted` | `siteId, contentId` |
| `theme.activated` | `siteId, themeKey` |
| `plugin.activated` | `siteId, pluginId` |
| `mail.sent` | `siteId, pluginKey, to[], subject, messageId, sentAt` — một biên nhận cho *mọi* lần gửi trên site, không mang theo nội dung. |
| `mail.failed` | `siteId, pluginKey, to[], subject, error, failedAt` |

### Filters — biến đổi một giá trị đang trên đường truyền, chặn và bị giới hạn

| Filter | Value | Context |
| --- | --- | --- |
| `content.seo` | `{ title?, description?, ogImage?, noindex?, canonical? }` — metadata của một trang, ngay trước khi theme render nó. | `siteId, contentId, path, title` |
| `mail.sending` | `{ subject, text?, html?, replyTo?, send }` — một email chuẩn bị gửi ngay trước SMTP. Trả về `send: false` để huỷ gửi. | `siteId, pluginKey, to[]` |

## Object `ctx`

| Property | Là gì | Scope yêu cầu |
| --- | --- | --- |
| `ctx.settings` | Cấu hình của plugin cho **site này**, hợp nhất với các giá trị mặc định của `settingsSchema`. | — |
| `ctx.secrets` | `{ placeholder: boolean }` — những `network.secrets` đã khai báo nào mà admin đã điền. Không bao giờ là giá trị thật. | — |
| `ctx.site` | `{ id, name, locale }` cho site hiện tại. | — |
| `ctx.log` | `info / warn / error(message, meta?)`. | — |
| `ctx.storage` | Lưu trữ key-value, giới hạn namespace theo (plugin, site). | — |
| `ctx.db` | Các bảng quan hệ **của riêng** plugin. | `data:own` + first-party + bảng đã khai báo |
| `ctx.content` | Đọc nội dung của site. | `content:read` |
| `ctx.jobs` | Xếp hàng việc chạy nền. | — |
| `ctx.mail` | Gửi email qua mail server của site. | `mail:send` |
| `ctx.http` | Tiếp cận một host bên ngoài đã khai báo. | `network:fetch` + `network.hosts` |

### `ctx.storage` — key-value, kho lưu trữ mặc định

```ts
await ctx.storage.set("counter", 3);
const n = await ctx.storage.get<number>("counter"); // 3, or null
await ctx.storage.list("prefix:");                  // [{ key, value }]
await ctx.storage.delete("counter");
```

Hãy dùng cái này trước khi nghĩ tới bảng quan hệ. Một plugin chỉ dùng `ctx.storage` hoàn toàn không để lại dấu vết schema nào, và bất kỳ plugin nào — cộng đồng hay first-party — đều có thể dùng nó. Key và value được cô lập theo từng plugin *và* từng site.

### `ctx.db` — các bảng của riêng plugin

Chỉ khả dụng cho các plugin first-party nắm giữ `data:own` và đã khai báo bảng trong `manifest.database`. Đây không phải là một database handle: không có kết nối, không có transaction và không có chuỗi SQL. Bạn nêu tên một bảng bạn sở hữu và một filter đẳng thức thuần; host dựng câu truy vấn tham số hoá ở phía bên kia ranh giới và đóng dấu `tenant_id`/`site_id` từ token của bạn lên mọi hàng.

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

Xem [Bảng dữ liệu và màn hình quản trị](/vi/developers/plugin-handbook/data-and-admin/) để biết cách khai báo bảng và gắn menu cho nó.

### `ctx.content` — đọc nội dung site

```ts
const page = await ctx.content.get(contentId);              // ContentDto | null
const posts = await ctx.content.list({ contentTypeKey: "post", status: "PUBLISHED" });
```

Chỉ đọc, và được kiểm soát bởi `content:read`. Ghi nội dung không nằm trên object này — một plugin tác động lên nội dung thông qua `filters` và `actions`, chứ không phải bằng cách ghi các hàng.

### `ctx.jobs` — làm việc về sau

```ts
await ctx.jobs.enqueue("sync-catalog", { since: lastRun });
```

Cách duy nhất để một plugin thực hiện việc trì hoãn. Payload được trao cho handler tương ứng trong `jobs` khi hàng đợi xử lý nó — cùng sandbox, cùng scope, ngoài đường request, với độ bền và cơ chế thử lại phía sau.

### `ctx.mail` — gửi email

```ts
await ctx.mail.send({ to: "a@b.co", subject: "Hello", text: "…", replyTo: "me@site" });
```

Yêu cầu `mail:send`. Không có `from` (người gửi trong phong bì là của site), không có SMTP host hay thông tin xác thực, và không có kết quả gửi — `send` được resolve khi thư được chấp nhận vào hàng đợi. Kết quả đến về sau dưới dạng các action `mail.sent` / `mail.failed`. Việc gửi bị giới hạn tần suất và khử trùng lặp theo từng site.

### `ctx.http` — tiếp cận dịch vụ bên ngoài

```ts
const res = await ctx.http.fetch({
  url: "https://api.deepl.com/v2/translate",
  method: "POST",
  headers: { Authorization: "DeepL-Auth-Key {{secret:deeplKey}}" },
  body: { text: ["Hello"], target_lang: "VI" },
});
const data = JSON.parse(res.body); // body arrives as text
```

Yêu cầu `network:fetch` **và** một khối `network` trong manifest nêu tên host — một plugin không thể tiếp cận một host mà admin không nhìn thấy trên màn hình chấp thuận. Gateway từ chối các địa chỉ private, loopback và link-local (trên mỗi lần redirect nữa), giới hạn mỗi request ở 10s và 1&nbsp;MB, và áp hạn ngạch theo giờ cho từng site.

:::note[Tiêu một khoá mà không cần nắm giữ nó]
Một setting được nêu tên dưới `network.secrets` bị giữ lại khỏi `ctx.settings`. Viết `{{secret:name}}` vào nơi cần thông tin xác thực; gateway thay bằng giá trị thật **sau** khi kiểm tra host, ở phía bên kia sandbox. Một plugin bị xâm phạm không thể tuồn ra một khoá mà nó chưa từng nhận.
:::

## Scope một plugin có thể yêu cầu

`manifest.permissions` liệt kê các phạm vi (scope) mà admin phê duyệt trên màn hình chấp thuận. Những scope mà một plugin thường cần nhất:

| Scope | Cấp cho |
| --- | --- |
| `content:read` | `ctx.content` |
| `content:create` · `content:update` · `content:delete` · `content:publish` | Ghi nội dung trên các đường dẫn phơi bày chúng. |
| `media:read` · `media:upload` · `media:update` · `media:delete` | Truy cập thư viện media. |
| `mail:send` | `ctx.mail` |
| `network:fetch` | `ctx.http` (với một khai báo `network`) |
| `data:own` | `ctx.db` và một khối `database` (chỉ first-party) |

`permissions` là các scope lõi mà plugin **yêu cầu để tiêu**. Đừng nhầm chúng với `permissionsProvided`, là các khoá quyền *mới* mà plugin **tạo ra** để kiểm soát các màn hình của chính nó — xem [Bảng dữ liệu và màn hình quản trị](/vi/developers/plugin-handbook/data-and-admin/) và [Quyền](/vi/developers/plugin-handbook/permissions/).

## Những gì không khả dụng

Không có `require`, không có `import` bất cứ thứ gì ngoài `@zcmsorg/plugin-sdk`, không có `fs`, không có `process`, không có `process.env`, không có `fetch`, không có `WebSocket`, không có timer (`setTimeout`/`setInterval`), và không có database hay network handle nào. Bundle thành một file CommonJS duy nhất (xem [Xây dựng plugin đầu tiên](/vi/developers/plugin-handbook/getting-started/)) và chỉ tiếp cận thế giới bên ngoài qua `ctx`.
