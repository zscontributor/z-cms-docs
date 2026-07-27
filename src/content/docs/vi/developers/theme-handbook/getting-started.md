---
title: Theme đầu tiên
description: Tạo theme bằng Z-CMS Theme SDK.
sidebar:
  order: 1
---

Theme định nghĩa cách `site-runtime` hiển thị website. Theme chỉ được phụ thuộc vào `@zcmsorg/theme-sdk`; không được truy cập trực tiếp API hoặc cơ sở dữ liệu.

## Chuẩn bị

Cài Node.js 22+, pnpm 10+ và `zcms` CLI:

```bash
npm install -g @zcmsorg/cli@latest
```

## Bước 1: Tạo project mẫu

```bash
zcms init ./corporate --kind theme --id com.acme.theme.corporate
```

Dùng reverse-DNS id thuộc domain mà bạn kiểm soát. `init` sẽ hỏi những gì bạn không truyền vào, và từ chối ghi vào một thư mục đã có nội dung.

Project theme được tạo sẵn cấu hình build, kiểm tra kiểu dữ liệu, đóng gói và ký:

```text
corporate/
├── theme.json           # manifest
├── package.json
├── build.mjs            # esbuild -> dist/index.mjs + dist/theme.css
├── tsconfig.json
├── src/
│   ├── index.tsx        # Layout, template, block, SEO
│   ├── theme.css
│   └── locales/en.json
└── .gitignore           # đã ignore *.pem — private key của bạn sẽ nằm ở đây
```

```bash
cd corporate
pnpm install
pnpm build
```

:::caution[Entry phải là `.mjs`, và React phải external]
`site-runtime` import theme của bạn bằng `file://` URL, nên entry là một ES module thật — và nó **phải là `dist/index.mjs`**. Một file `dist/index.js` sẽ lấy module format từ `"type"` trong `package.json` gần nhất, mà `package.json` lại nằm bên trong package; khi runtime đoán sai, nó ném "Cannot use import statement outside a module", bắt lỗi đó, rồi **âm thầm quay về default theme**. Bạn sẽ không thấy lỗi nào — chỉ thấy sai theme.

`react` và `react/jsx-runtime` phải giữ ở dạng **external**, để component của bạn render trên cùng React instance với host. Hai bản React trong một lần render sinh ra "invalid hook call" — chỉ xảy ra ở production.

`build.mjs` đã làm đúng cả hai. Hãy đọc comment trong đó trước khi sửa.
:::

Phần còn lại của trang này giải thích nội dung các tệp được tạo, để bạn có thể chỉnh sửa đúng cách.

## Bước 2: Khai báo capability của theme

Tạo `theme.json` tại thư mục gốc của package. Các trường bắt buộc là `id`, `name`, `version`, `author`, `engine`, `templates`, `menuLocations` và `settingsSchema`. Với theme, `entry` phải là `dist/index.mjs`; `styles` trỏ tới stylesheet đi kèm theme.

```json
{
  "id": "com.example.theme.corporate",
  "name": "Corporate",
  "version": "0.1.0",
  "description": "Responsive corporate theme.",
  "changelog": "- First public release.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.mjs",
  "styles": "dist/theme.css",
  "templates": ["home", "page", "post", "archive", "notFound", "error"],
  "menuLocations": [
    { "key": "primary", "name": "Primary menu" },
    { "key": "footer", "name": "Footer menu" }
  ],
  "settingsSchema": {
    "type": "object",
    "properties": {
      "primaryColor": {
        "type": "string",
        "title": "Primary colour",
        "format": "color",
        "default": ""
      }
    }
  },
  "media": {
    "screenshots": ["screenshots/home.png"]
  }
}
```

Các trường tùy chọn gồm `changelog`, `seo`, `media`, `demo` và `optionalCapabilities`. Không đổi tên template, khóa menu hoặc khóa thiết lập giữa các phiên bản vì website có thể tiếp tục tham chiếu đến chúng.

Trường tùy chọn `changelog` chứa ghi chú phát hành của phiên bản này — một danh sách ngắn những thay đổi so với phiên bản trước. Quản trị viên thấy nó dưới dạng mục "Có gì mới" trong trình quản lý theme, nên biết bản cập nhật mang lại điều gì trước khi áp dụng. Viết văn bản thuần, mỗi thay đổi một dòng (cho phép dòng trống và tab); giới hạn 2000 ký tự. Mỗi phiên bản đã phát hành giữ ghi chú riêng, vì vậy hãy cập nhật `changelog` mỗi khi tăng `version`.

## Bước 3: Xây dựng template và block

Triển khai template cho trang chủ, page, bài viết, archive, lỗi và fallback bằng type của `@zcmsorg/theme-sdk`. Theme không tự lấy Pages hoặc Blogs: `site-runtime` truyền nội dung khớp với URL qua `content`, danh sách qua `archive` và dữ liệu dùng chung của website qua `ctx`.

Hãy bắt đầu với [Hiển thị page và bài viết blog](/vi/developers/theme-handbook/rendering-content/) để xem ví dụ hoàn chỉnh về `content.data`, `content.blocks`, phân trang, menu và URL đa ngôn ngữ. Nếu theme đi kèm dữ liệu mẫu, hãy làm theo [Cung cấp dữ liệu demo](/vi/developers/theme-handbook/demo-content/). Nếu theme hỗ trợ tính năng tùy chọn từ plugin, đọc tiếp [Tích hợp theme với plugin](/vi/developers/theme-handbook/plugin-integration/).

1. Chỉ hiển thị dữ liệu do `site-runtime` cung cấp.
2. Escape nội dung không tin cậy theo đúng kiểu của trường.
3. Bảo đảm heading structure, keyboard navigation và focus state đáp ứng accessibility.
4. Định nghĩa responsive behavior cho viewport hẹp và rộng.
5. Có nội dung dự phòng an toàn khi thiếu nội dung, media hoặc menu tùy chọn.

## Bước 4: Định nghĩa setting

Định nghĩa theme setting bằng JSON Schema. Admin tạo form cấu hình từ schema này, vì vậy theme có thể bổ sung setting mà không cần sửa `admin-web`.

Giữ khả năng tương thích ngược cho thiết lập. Thêm giá trị mặc định cho trường mới, không âm thầm thay đổi ý nghĩa của trường cũ và ghi rõ mọi yêu cầu chuyển đổi dữ liệu.

## Bước 5: Thêm asset và translation

- Chỉ đưa vào package những asset mà theme sử dụng.
- Tối ưu hình ảnh và font trước khi đóng gói.
- Dùng translation key thay vì hard-code UI text.
- Cung cấp default message cho mọi key.
- Tách nội dung của người dùng khỏi chuỗi dịch của theme.

## Bước 6: Preview trên local

Build theme và nạp bản build local lên một website kiểm thử. Xem trước ít nhất:

1. Trang chủ, trang danh sách, trang chi tiết và trang 404.
2. Trạng thái rỗng, nội dung tối thiểu và nội dung dài.
3. Tất cả locale được hỗ trợ.
4. Layout desktop và mobile.
5. Brand asset trên nền sáng và tối nếu có hỗ trợ.
6. Metadata, Open Graph, robots policy và JSON-LD output.

Chuyển sang theme khác rồi kích hoạt lại để xác nhận quá trình này không xóa nội dung hoặc thiết lập.

## Bước 7: Test và đóng gói

Chạy typecheck, lint, unit test, accessibility check và visual regression test. Sau đó:

1. Cập nhật ghi chú `changelog` trong manifest. Đừng động vào `version` — `zcms pack` (bước 4) sẽ đóng dấu và tăng version trong manifest giúp bạn; truyền `--set-version` nếu bạn cần một version cụ thể.
2. Build từ clean checkout bằng lockfile đã commit.
3. Tạo cặp khóa của nhà phát hành một lần nếu chưa có:

   ```bash
   zcms keygen --out ./keys
   ```

4. Tạo thư mục chứa file output, rồi pack trực tiếp từ project root. CLI tự loại source, dependency và file cấu hình chỉ dùng khi phát triển:

   ```bash
   mkdir -p release

   zcms pack . --kind theme \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/corporate-0.1.0.zcms
   ```

5. Xác minh chữ ký của nhà phát hành:

   ```bash
   zcms verify ./release/corporate-0.1.0.zcms
   ```

6. Xác nhận kết quả có `publisher signature : VALID`, rồi lưu checksum do `zcms pack` in ra. Dòng `marketplace signature : not checked` là bình thường ở bước này vì Marketplace chưa ký package.

Marketplace chạy trình quét tĩnh sau khi tải lên và thêm chữ ký trong quá trình tiếp nhận. Tiếp tục với [Phát hành package](/vi/marketplace/publishing/).
