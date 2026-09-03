---
title: Hiển thị trang và bài viết
description: Hiển thị nội dung, danh sách, trường dữ liệu, khối, menu và liên kết đa ngôn ngữ từ dữ liệu site-runtime cung cấp.
sidebar:
  order: 2
---

Theme Z-CMS không gọi Content API để lấy trang hoặc bài viết. Với mỗi URL công khai, `site-runtime` xác định website và chuyển dữ liệu tới theme đang hoạt động. Theme chỉ hiển thị dữ liệu nhận được.

Một yêu cầu được xử lý theo thứ tự:

1. Khách truy cập mở URL công khai.
2. `site-runtime` gọi Render API nội bộ một lần.
3. API xác định tên máy chủ, ngôn ngữ, đường dẫn, nội dung đã xuất bản, menu, cấu hình theme và capability của các plugin đang hoạt động.
4. `site-runtime` chọn mẫu trang phù hợp.
5. Mẫu trang hiển thị dữ liệu từ `content`, `archive` và `ctx`.

:::caution[Không gọi Render API từ theme]
Yêu cầu nội bộ `GET /api/v1/render/resolve` cần token nội bộ và do `site-runtime` thực hiện. Theme không được tự gửi yêu cầu này. Không nhập thư viện gọi API, gọi `fetch` hoặc nhúng token nội bộ vào theme.
:::

## Bước 1: Nhập kiểu dữ liệu cho mẫu trang

Dùng kiểu dữ liệu từ `@zcmsorg/theme-sdk` để đầu vào của mẫu trang khớp với giao thức dữ liệu của runtime.

```tsx
import {
  defineTheme,
  type ArchiveTemplateProps,
  type PageTemplateProps,
  type ThemeManifest,
} from "@zcmsorg/theme-sdk";
import manifestJson from "../theme.json";

const manifest = manifestJson as unknown as ThemeManifest;

interface Settings {
  accent: string;
}
```

Không nhập kiểu dữ liệu từ `cms-api`, `site-runtime`, Prisma hoặc các module nội bộ khác của Z-CMS.

## Bước 2: Hiển thị trang nội dung

Runtime truyền trang đã xuất bản, khớp với URL, vào `content`.

```tsx
function Page({ ctx, content }: PageTemplateProps<Settings>) {
  return (
    <article>
      <h1>{content.title}</h1>
      {content.excerpt ? <p>{content.excerpt}</p> : null}
      <div>{ctx.renderBlocks(content.blocks)}</div>
    </article>
  );
}
```

Các trường thường dùng trong `content`:

| Trường | Mục đích |
| --- | --- |
| `title` | Tiêu đề trang hoặc bài viết |
| `excerpt` | Phần tóm tắt, có thể không có |
| `path` | Đường dẫn nội dung trước khi thêm tiền tố ngôn ngữ |
| `contentType.key` | Mã loại nội dung, ví dụ `page` hoặc `post` |
| `data` | Các trường tùy chỉnh của loại nội dung |
| `blocks` | Danh sách khối được tạo trong trình soạn thảo |
| `publishedAt` | Thời điểm xuất bản hoặc `null` |
| `author` | Thông tin tác giả hoặc `null` |
| `seo` | Dữ liệu SEO đã được xử lý |

Dữ liệu hiển thị công khai chỉ chứa nội dung đã xuất bản. Theme không cần tự loại bỏ bản nháp.

## Bước 3: Đọc trường tùy chỉnh an toàn

Các giá trị trong `content.data` là JSON và có kiểu `unknown`. Hãy kiểm tra từng giá trị trước khi hiển thị.

```tsx
function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function Page({ ctx, content }: PageTemplateProps<Settings>) {
  const subtitle = text(content.data.subtitle);

  return (
    <article>
      <h1>{content.title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {ctx.renderBlocks(content.blocks)}
    </article>
  );
}
```

Không dùng phép ép kiểu để mặc nhiên coi toàn bộ `content.data` là dữ liệu hợp lệ. Theme cần kiểm tra giá trị khi chạy, vì chủ website có thể thay đổi trường của loại nội dung mà không cập nhật theme.

## Bước 4: Hiển thị một bài viết blog

Khi `content.contentType.key` là `post`, `site-runtime` chọn `templates.post`. Nếu theme không có mẫu này, runtime dùng `templates.page`.

```tsx
function Post({ ctx, content }: PageTemplateProps<Settings>) {
  const date = content.publishedAt
    ? new Date(content.publishedAt).toLocaleDateString(ctx.locale)
    : "";

  return (
    <article>
      <a href={ctx.url("/blog")}>Quay lại blog</a>
      <h1>{content.title}</h1>
      <p>{[date, content.author?.name].filter(Boolean).join(" · ")}</p>
      {content.excerpt ? <p>{content.excerpt}</p> : null}
      {ctx.renderBlocks(content.blocks)}
    </article>
  );
}
```

## Bước 5: Hiển thị danh sách bài viết blog

Đường dẫn danh sách như `/blog` nhận `archive` thay vì `content`, gồm các bài viết đã xuất bản và thông tin phân trang.

```tsx
function Archive({ ctx, archive }: ArchiveTemplateProps<Settings>) {
  return (
    <section>
      <h1>{archive.title}</h1>

      {archive.items.length === 0 ? (
        <p>Chưa có bài viết.</p>
      ) : (
        <ul>
          {archive.items.map((item) => (
            <li key={item.id}>
              <a href={ctx.url(item.path)}>{item.title}</a>
              {item.excerpt ? <p>{item.excerpt}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {archive.page > 1 ? (
        <a href={ctx.url(`${archive.basePath}?page=${archive.page - 1}`)}>Trang trước</a>
      ) : null}
      {archive.page < archive.totalPages ? (
        <a href={ctx.url(`${archive.basePath}?page=${archive.page + 1}`)}>Trang sau</a>
      ) : null}
    </section>
  );
}
```

Luôn dùng `ctx.url()` cho đường dẫn nội bộ của nội dung và trang danh sách. Hàm thêm đúng tiền tố ngôn ngữ và giữ nguyên chuỗi truy vấn. Riêng các đường dẫn trong `ctx.alternates` đã hoàn chỉnh, nên không truyền lại qua `ctx.url()`.

## Bước 6: Đăng ký mẫu trang

Mẫu `page` là bắt buộc. Các mẫu nội dung khác có thể dùng `page` làm phương án dự phòng; riêng đường dẫn danh sách cần mẫu `archive`.

```tsx
export default defineTheme<Settings>({
  manifest,
  Layout,
  templates: {
    home: Home,
    page: Page,
    post: Post,
    archive: Archive,
    notFound: NotFound,
    error: ErrorPage,
  },
  blocks,
});
```

| Yêu cầu | Mẫu được runtime chọn |
| --- | --- |
| `/` có nội dung trang chủ | `home`; nếu không có mẫu này thì dùng `page` |
| Nội dung có khóa `post` | `post`; nếu không có mẫu này thì dùng `page` |
| Nội dung khác | `page` |
| Danh sách của một loại nội dung, ví dụ `/blog` | `archive` |
| Đường dẫn không tồn tại | `notFound` |

## Bước 7: Hiển thị khối nội dung

Gọi `ctx.renderBlocks(content.blocks)` thay vì tự duyệt từng khối trong mỗi mẫu trang. Đăng ký thành phần hiển thị cho từng loại khối mà theme hỗ trợ.

```tsx
import type { BlockProps } from "@zcmsorg/theme-sdk";

function value(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function Hero({ props }: BlockProps<Record<string, unknown>, Settings>) {
  return (
    <section>
      <h2>{value(props.heading)}</h2>
      {props.subheading ? <p>{value(props.subheading)}</p> : null}
    </section>
  );
}

const blocks = {
  "core/hero": Hero,
  "core/richtext": RichText,
  "core/features": Features,
  "core/image": ImageBlock,
  "core/cta": CallToAction,
};
```

Tên loại khối phải có không gian tên riêng. Khối chưa được hỗ trợ sẽ hiển thị cảnh báo trong môi trường phát triển và bị bỏ qua trên hệ thống chạy thực tế. Hãy kiểm tra tất cả loại khối mà website mục tiêu sử dụng.

## Bước 8: Hiển thị menu, tài nguyên và liên kết đa ngôn ngữ

- Đọc menu từ `ctx.menus.primary`, `ctx.menus.footer` hoặc khóa khác đã khai báo trong `theme.json`.
- Dùng `ctx.url(path)` cho liên kết nội bộ.
- Dùng `ctx.asset("assets/logo.png")` cho tệp nằm trong gói theme.
- Dùng `ctx.site.brand` cho logo và màu chủ đạo của website.
- Dùng `ctx.settings` cho cấu hình riêng của theme.
- Dùng `ctx.alternates` để tạo danh sách chuyển ngôn ngữ.

## Bước 9: Kiểm tra toàn bộ luồng nội dung

Trước khi đóng gói, hãy kiểm tra:

1. Trang có và không có phần tóm tắt.
2. Trang chứa đủ các khối tích hợp sẵn mà theme hỗ trợ.
3. Bài viết có và không có tác giả hoặc ngày xuất bản.
4. Danh sách bài viết rỗng và danh sách có nhiều trang.
5. Trường tùy chỉnh bị thiếu hoặc sai kiểu dữ liệu.
6. Ngôn ngữ mặc định và các ngôn ngữ khác, đặc biệt là liên kết phân trang.
7. Khối chưa được hỗ trợ, để xác nhận trang vẫn hiển thị.

Tiếp theo, xem cách [tích hợp theme với plugin](/vi/developers/theme-handbook/plugin-integration/).
