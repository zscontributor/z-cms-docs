---
title: Tạo theme đầu tiên
description: Xây dựng, cấu hình và kiểm thử theme bằng Z-CMS Theme SDK.
sidebar:
  order: 1
---

Theme định nghĩa cách `site-runtime` hiển thị website. Theme chỉ được phụ thuộc vào `@zcmsorg/theme-sdk`; không được truy cập trực tiếp API hoặc cơ sở dữ liệu.

## Chuẩn bị

Cài Node.js 22+, pnpm 10+ và `zcms` CLI:

```bash
npm install -g @zcmsorg/cli@latest
```

## Bước 1: Tạo dự án mẫu

```bash
zcms init ./corporate --kind theme --id com.acme.theme.corporate
```

Chọn ID theo dạng tên miền đảo ngược (reverse-DNS), dựa trên tên miền bạn kiểm soát. `init` sẽ hỏi các thông tin chưa được truyền qua tham số và từ chối ghi vào thư mục đã có nội dung.

Dự án theme được tạo sẵn cấu hình biên dịch, kiểm tra kiểu dữ liệu, đóng gói và ký:

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

:::caution[Tệp đầu vào phải là `.mjs` và không được gộp React]
`site-runtime` nạp theme qua URL `file://`, nên tệp đầu vào phải là ES module có đường dẫn `dist/index.mjs`. Nếu dùng `dist/index.js`, định dạng module phụ thuộc vào trường `"type"` của `package.json` gần nhất. Khi định dạng không khớp, runtime gặp lỗi "Cannot use import statement outside a module" và chuyển sang theme mặc định. Vì vậy, dấu hiệu bạn thấy có thể chỉ là website hiển thị sai theme.

Giữ `react` và `react/jsx-runtime` ở dạng **external**, tức không gộp vào tệp đầu ra, để theme dùng cùng phiên bản React đang chạy trên tiến trình chủ. Nếu gộp thêm React, hệ thống có thể nạp hai bản và gặp lỗi "invalid hook call" khi chạy bản phát hành.

`build.mjs` đã cấu hình sẵn cả hai yêu cầu. Hãy đọc chú thích trong tệp trước khi thay đổi.
:::

Phần còn lại của trang này giải thích nội dung các tệp được tạo, để bạn có thể chỉnh sửa đúng cách.

## Bước 2: Khai báo cấu trúc và tính năng của theme

Tạo `theme.json` tại thư mục gốc của gói. Các trường bắt buộc là `id`, `name`, `version`, `author`, `engine`, `templates`, `menuLocations` và `settingsSchema`. Trường `entry` phải là `dist/index.mjs`; `styles` trỏ tới tệp CSS đi kèm theme.

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

Các trường tùy chọn gồm `changelog`, `seo`, `media`, `demo` và `optionalCapabilities`. Giữ nguyên tên mẫu trang, khóa menu và khóa cấu hình giữa các phiên bản vì website có thể vẫn tham chiếu tới chúng.

Trường `changelog` chứa ghi chú ngắn về những thay đổi của phiên bản hiện tại. Quản trị viên đọc nội dung này trong mục **Có gì mới** trước khi cập nhật theme. Dùng văn bản thuần, mỗi thay đổi một dòng; cho phép dòng trống và ký tự tab, tối đa 2000 ký tự. Mỗi phiên bản giữ ghi chú riêng, vì vậy cần cập nhật `changelog` mỗi khi tăng `version`.

## Bước 3: Xây dựng mẫu trang và khối nội dung

Dùng các kiểu dữ liệu của `@zcmsorg/theme-sdk` để triển khai mẫu trang chủ, trang nội dung, bài viết, danh sách, trang lỗi và cách hiển thị dự phòng. Theme không tự lấy dữ liệu trang hoặc bài viết: `site-runtime` truyền nội dung khớp URL qua `content`, danh sách qua `archive` và dữ liệu dùng chung qua `ctx`.

Xem [Hiển thị trang và bài viết](/vi/developers/theme-handbook/rendering-content/) để có ví dụ về `content.data`, `content.blocks`, phân trang, menu và URL đa ngôn ngữ. Nếu theme có dữ liệu mẫu, đọc [Cung cấp dữ liệu mẫu](/vi/developers/theme-handbook/demo-content/). Nếu cần tính năng tùy chọn từ plugin, xem [Tích hợp theme với plugin](/vi/developers/theme-handbook/plugin-integration/).

1. Chỉ hiển thị dữ liệu do `site-runtime` cung cấp.
2. Xử lý ký tự đặc biệt của nội dung không tin cậy theo đúng ngữ cảnh hiển thị.
3. Bảo đảm cấu trúc tiêu đề, thao tác bàn phím và dấu hiệu nhận biết phần tử đang được chọn đáp ứng yêu cầu về khả năng tiếp cận.
4. Thiết kế bố cục phù hợp với cả màn hình nhỏ và lớn.
5. Có cách hiển thị dự phòng an toàn khi thiếu nội dung, hình ảnh hoặc menu tùy chọn.

## Bước 4: Định nghĩa các mục cấu hình

Định nghĩa cấu hình theme bằng JSON Schema. Trang quản trị tạo biểu mẫu từ schema này, nên bạn có thể thêm cấu hình riêng cho theme mà không sửa `admin-web`.

Giữ khả năng tương thích ngược cho thiết lập. Thêm giá trị mặc định cho trường mới, không âm thầm thay đổi ý nghĩa của trường cũ và ghi rõ mọi yêu cầu chuyển đổi dữ liệu.

## Bước 5: Thêm tài nguyên và bản dịch

- Chỉ đưa vào gói những tài nguyên theme thực sự sử dụng.
- Tối ưu hình ảnh và phông chữ trước khi đóng gói.
- Dùng khóa bản dịch thay vì viết cố định văn bản giao diện trong mã.
- Cung cấp nội dung mặc định cho mọi khóa bản dịch.
- Tách nội dung của người dùng khỏi các chuỗi giao diện của theme.

## Bước 6: Xem trước trên máy cá nhân

Biên dịch theme và cài bản vừa tạo lên website kiểm thử. Kiểm tra ít nhất các trường hợp sau:

1. Trang chủ, trang danh sách, trang chi tiết và trang 404.
2. Trường hợp chưa có dữ liệu, nội dung tối thiểu và nội dung dài.
3. Tất cả ngôn ngữ được hỗ trợ.
4. Bố cục trên máy tính và thiết bị di động.
5. Logo và tài nguyên thương hiệu trên nền sáng và tối, nếu theme có hỗ trợ.
6. Thông tin SEO, Open Graph, chỉ dẫn robots và dữ liệu JSON-LD.

Chuyển sang theme khác rồi kích hoạt lại để xác nhận quá trình này không xóa nội dung hoặc thiết lập.

## Bước 7: Kiểm thử và đóng gói

Chạy kiểm tra kiểu dữ liệu, quy tắc mã nguồn, kiểm thử đơn vị, kiểm tra khả năng tiếp cận và so sánh giao diện để phát hiện thay đổi ngoài ý muốn. Sau đó:

1. Cập nhật `changelog` trong manifest. Không cần tự tăng `version`: lệnh `zcms pack` ở mục 4 bên dưới đóng gói phiên bản hiện tại rồi tăng phiên bản cho lần phát hành sau. Dùng `--set-version` nếu cần chỉ định phiên bản cụ thể.
2. Biên dịch từ bản mã nguồn sạch bằng tệp khóa phụ thuộc đã lưu trong Git.
3. Nếu chưa có cặp khóa của nhà phát hành, tạo một lần bằng:

   ```bash
   zcms keygen --out ./keys
   ```

4. Tạo thư mục đầu ra rồi đóng gói từ thư mục gốc dự án. CLI tự loại mã nguồn, thư viện phụ thuộc và cấu hình chỉ dùng khi phát triển:

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

6. Xác nhận kết quả có `publisher signature : VALID`, rồi lưu checksum do `zcms pack` in ra. Dòng `marketplace signature : not checked` là bình thường ở bước này vì Marketplace chưa ký gói.

Marketplace chạy trình quét tĩnh sau khi tải lên và thêm chữ ký trong quá trình tiếp nhận. Tiếp tục với [Phát hành gói cài đặt](/vi/marketplace/publishing/).
