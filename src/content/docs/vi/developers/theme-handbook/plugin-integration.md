---
title: Tích hợp theme với plugin
description: Kết nối theme với tính năng của plugin qua capability và khối nội dung có không gian tên riêng.
sidebar:
  order: 3
---

Theme và plugin không nhập mã của nhau. Plugin công bố mã tính năng (capability); dữ liệu phục vụ hiển thị của nền tảng cho biết các tính năng nào đang hoạt động. Theme kiểm tra thông tin này bằng `ctx.hasCapability()`.

:::note[Capability là gì?]
Capability là mã nhận diện tính năng, ví dụ `commerce.products` hoặc `reviews.summary`. Mã này không chứa dữ liệu và không cấp cho theme quyền truy cập cấu hình, kho lưu trữ, bảng dữ liệu hoặc API của plugin.
:::

## Bước 1: Xác định giao thức tích hợp công khai

Chọn mã tính năng ổn định, có không gian tên riêng và mô tả chức năng, không gắn với một cách triển khai cụ thể.

Ví dụ phù hợp:

- `reviews.summary`
- `commerce.products`
- `search.facets`

Không nên dùng tên gắn với một lần cài hoặc phiên bản như `acme-plugin-v2-installed`.

Tiếp theo, xác định nguồn của dữ liệu công khai:

- Dùng thuộc tính của khối (props) nếu dữ liệu đã được lưu trong nội dung trang.
- Dùng trường trong dữ liệu hiển thị do nền tảng cung cấp nếu dữ liệu phải được tạo động theo từng yêu cầu. Cách này cần thay đổi giao thức dữ liệu của phần lõi Z-CMS.
- Không để theme gọi điểm truy cập riêng của plugin hoặc CMS.

## Bước 2: Công bố capability từ plugin

Thêm capability vào `plugin.json` của plugin:

```json
{
  "id": "com.acme.plugin.reviews",
  "capabilities": ["reviews.summary"]
}
```

Chỉ plugin đã cài và đang hoạt động mới bổ sung capability vào dữ liệu hiển thị của website. Khi tắt plugin, capability tương ứng cũng không còn được cung cấp.

## Bước 3: Khai báo capability tùy chọn trong theme

Thêm capability vào `theme.json`:

```json
{
  "id": "com.acme.theme.storefront",
  "optionalCapabilities": ["reviews.summary"]
}
```

Capability này phải là tùy chọn. Theme vẫn phải hiển thị được khi plugin chưa cài, bị tắt hoặc được thay bằng plugin khác.

## Bước 4: Kiểm tra tính năng trong mẫu trang

Dùng `ctx.hasCapability()` và luôn có cách hiển thị thay thế.

```tsx
function ProductPage({ ctx, content }: PageTemplateProps<Settings>) {
  const reviewsEnabled = ctx.hasCapability("reviews.summary");

  return (
    <article>
      <h1>{content.title}</h1>
      {ctx.renderBlocks(content.blocks)}
      {!reviewsEnabled ? <p>Tính năng đánh giá hiện không khả dụng.</p> : null}
    </article>
  );
}
```

Capability chỉ cho biết có plugin đang cung cấp tính năng đó hay không. Nó không trả về đánh giá, sản phẩm hay bản ghi khác của plugin.

## Bước 5: Hiển thị khối nội dung liên quan đến plugin

Nếu nội dung trang chứa khối có không gian tên riêng và dữ liệu công khai nằm trong props, hãy đăng ký thành phần hiển thị khối đó trong theme.

Ví dụ khối được lưu trong `content.blocks`:

```json
{
  "id": "review-summary-1",
  "type": "acme/review-summary",
  "props": {
    "average": 4.8,
    "count": 124
  }
}
```

Thành phần hiển thị trong theme:

```tsx
interface ReviewSummaryProps {
  average?: unknown;
  count?: unknown;
}

function ReviewSummary({
  ctx,
  props,
}: BlockProps<ReviewSummaryProps, Settings>) {
  if (!ctx.hasCapability("reviews.summary")) return null;

  const average = typeof props.average === "number" ? props.average : 0;
  const count = typeof props.count === "number" ? props.count : 0;

  return (
    <section aria-label="Đánh giá">
      <strong>{average.toFixed(1)} / 5</strong>
      <span>{count} lượt đánh giá</span>
    </section>
  );
}

const blocks = {
  "core/hero": Hero,
  "core/richtext": RichText,
  "acme/review-summary": ReviewSummary,
};
```

Kiểm tra props của khối do plugin cung cấp như với khối tích hợp sẵn của Z-CMS. Các giá trị JSON có thể thiếu hoặc vẫn dùng định dạng của phiên bản plugin cũ.

## Bước 6: Xử lý khi plugin bị thiếu hoặc thay đổi

Kiểm tra tất cả trạng thái sau:

1. Plugin chưa được cài.
2. Plugin đã cài nhưng chưa hoạt động.
3. Plugin đang hoạt động và có đủ dữ liệu khối.
4. Capability tồn tại nhưng props rỗng hoặc dùng cấu trúc cũ.
5. Trang vẫn còn khối nhưng plugin không còn cung cấp capability.

Trang phải sử dụng được trong mọi trường hợp. Không để điều hướng, tiêu đề hoặc nội dung chính phụ thuộc hoàn toàn vào một tính năng tùy chọn.

## Giới hạn của cơ chế tích hợp hiện tại

Theme SDK hỗ trợ tích hợp gián tiếp với plugin: `ctx.hasCapability()` phát hiện tính năng, `ctx.getIntegration()` đọc dữ liệu công khai đã được phần lõi cho phép, còn `ctx.renderSlot()` bố trí giao diện tương tác do runtime quản lý. Theme không nhập mã hoặc nhận thông tin xác thực của plugin.

Cơ chế hiện tại không cho phép theme:

- Gọi tùy ý hàm xử lý của plugin; không có `ctx.callPlugin()` hoặc `ctx.callCapability()`.
- Đọc cấu hình hoặc kho lưu trữ của plugin.
- Truy vấn trực tiếp bảng dữ liệu riêng của plugin.
- Lấy dữ liệu plugin tùy ý qua `ctx.hasCapability()`.
- Tự đăng ký định dạng dữ liệu động mới chỉ bằng một gói cài đặt.

Nếu cần dữ liệu hoặc thao tác theo từng yêu cầu, phần lõi phải định nghĩa và cho phép phần dữ liệu công khai hoặc thao tác tích hợp tương ứng. Chẳng hạn, `ai.assistant` cung cấp dữ liệu hiển thị qua `getIntegration()`, đặt giao diện trò chuyện qua `renderSlot("floating")` và chỉ cho phép thao tác `chat` qua gateway. Đây không phải cơ chế để theme gọi tùy ý plugin. Hướng dẫn theme gọi API riêng vẫn nằm ngoài phạm vi hỗ trợ và không bảo đảm an toàn.

Xem [Hiển thị trang và bài viết](/vi/developers/theme-handbook/rendering-content/) để hiểu luồng dữ liệu đầy đủ của mẫu trang.
