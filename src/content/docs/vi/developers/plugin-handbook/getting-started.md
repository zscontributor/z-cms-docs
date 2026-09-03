---
title: Tạo plugin đầu tiên
description: Tạo dự án, khai báo quyền, triển khai và kiểm thử plugin Z-CMS trước khi phát hành.
sidebar:
  order: 1
---

Plugin chạy trong vùng thực thi V8 cô lập (V8 isolate). Mọi quyền sử dụng tài nguyên đều phải được khai báo trong manifest, được Administrator phê duyệt và được CMS gateway kiểm tra khi thực thi.

## Chuẩn bị

Cài Node.js 22+, pnpm 10+ và `zcms` CLI:

```bash
npm install -g @zcmsorg/cli@latest
```

## Bước 1: Tạo dự án mẫu

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
```

Chọn ID theo dạng tên miền đảo ngược (reverse-DNS), dựa trên tên miền bạn kiểm soát. `init` sẽ hỏi các thông tin chưa được truyền qua tham số và từ chối ghi vào thư mục đã có nội dung.

Dự án được tạo sẵn cấu hình biên dịch, kiểm tra kiểu dữ liệu, kiểm thử, đóng gói và ký:

```text
hello/
├── plugin.json          # manifest
├── package.json
├── build.mjs            # esbuild -> MỘT file CommonJS duy nhất
├── tsconfig.json
├── src/index.ts
├── test/plugin.test.ts
└── .gitignore           # đã ignore *.pem — private key của bạn sẽ nằm ở đây
```

```bash
cd hello
pnpm install
pnpm build
pnpm test
```

:::caution[Phải biên dịch thành một tệp CommonJS duy nhất]
Sandbox chỉ chạy một tệp CommonJS và chỉ cung cấp module `@zcmsorg/plugin-sdk`. Nếu mã đầu ra gồm nhiều tệp, các lệnh `require()` tương đối sẽ không được phân giải. Lỗi có thể chỉ xuất hiện khi kích hoạt plugin trên website.

`build.mjs` đã được cấu hình để gộp mã nguồn thành một tệp. Bạn vẫn có thể chia mã nguồn thành nhiều tệp, nhưng phải giữ `format: "cjs"` và không gộp SDK vào tệp đầu ra (để SDK ở dạng external).
:::

Các phần tiếp theo giải thích những tệp được tạo sẵn và cách tùy chỉnh chúng.

## Bước 2: Hoàn thiện manifest

Tạo `plugin.json` tại thư mục gốc của gói. Các trường bắt buộc là `id`, `name`, `version`, `author` và `engine`. Trường `entry` mặc định là `dist/index.js`; `permissions` liệt kê các quyền cần phê duyệt khi kích hoạt.

```json
{
  "id": "com.example.plugin.hello",
  "name": "Hello Plugin",
  "version": "0.1.0",
  "description": "Adds a read-only content helper.",
  "changelog": "- First public release.",
  "author": {
    "name": "Example Studio",
    "url": "https://example.com"
  },
  "engine": ">=0.1.0",
  "entry": "dist/index.js",
  "scope": "site",
  "permissions": ["content:read"],
  "capabilities": ["hello.content-helper"],
  "media": {
    "screenshots": ["screenshots/admin.png"]
  }
}
```

Các trường tùy chọn gồm `changelog`, `scope`, `capabilities`, `media`, `settingsSchema` và `database.tables`. Nên ưu tiên `ctx.storage`; chỉ khai báo bảng quan hệ khi thực sự cần. Tên bảng phải dùng tiền tố riêng của plugin theo quy định của nền tảng.

Trường `changelog` chứa ghi chú ngắn về những thay đổi của phiên bản hiện tại. Quản trị viên đọc nội dung này trong mục **Có gì mới** khi quản lý plugin hoặc xem xét cập nhật. Dùng văn bản thuần, mỗi thay đổi một dòng; cho phép dòng trống và ký tự tab, tối đa 2000 ký tự. Cập nhật ghi chú mỗi khi tăng `version`.

`scope` khai báo **phạm vi kích hoạt** của plugin và có thể là `"site"` (mặc định) hoặc `"org"`:

- `"site"` — cài và kích hoạt riêng cho từng website. Đây là mặc định, phù hợp với hầu hết plugin (SEO, thương mại, trợ lý AI…).
- `"org"` — cài **một lần cho cả tổ chức (tenant)** và chạy trên **mọi website** thuộc tổ chức đó, giống plugin "network-activated" của WordPress. Quản trị viên quản lý ở màn hình **Plugin tổ chức** riêng.

`scope` xác định nơi plugin hoạt động, không cấp thêm quyền. Plugin `"org"` vẫn cần được phê duyệt quyền ở phạm vi tổ chức và không tự trở thành plugin lõi. Z-CMS đọc trường này từ manifest đã ký, nên gói không thể dùng nó để tự nâng quyền. Xem [Theme và plugin](/vi/users/extensions/) để biết cách kích hoạt theo từng phạm vi.

## Bước 3: Triển khai điểm vào của plugin

Triển khai điểm vào (entrypoint) bằng các kiểu dữ liệu và API của `@zcmsorg/plugin-sdk`.

- Chỉ dùng API mà SDK cung cấp.
- Truy cập nội dung, hình ảnh, tệp và email qua gateway của SDK.
- Xử lý an toàn nếu quyền tùy chọn không được phê duyệt.
- Lưu khóa bí mật trong kho bảo mật của nền tảng, không đưa vào gói plugin.
- Không nhập thư viện cơ sở dữ liệu, API hệ thống tệp hoặc module tích hợp của Node.js ngoài phạm vi runtime hỗ trợ.

## Bước 4: Chạy thử trên máy cá nhân

Biên dịch plugin và khởi động môi trường phát triển Z-CMS. Cài bản vừa biên dịch lên website kiểm thử, sau đó kích hoạt trong phạm vi kiểm thử phù hợp.

Kiểm tra lần lượt:

1. Plugin được nạp thành công, không có lỗi thực thi hoặc lỗi cấu trúc dữ liệu.
2. Mỗi chức năng hoạt động với tập quyền tối thiểu đã ghi trong tài liệu.
3. Plugin xử lý an toàn khi quyền bị từ chối.
4. Vô hiệu hóa plugin dừng đúng các hàm xử lý sự kiện và tác vụ nền.
5. Kích hoạt lại không tạo trùng tác vụ, webhook hoặc cấu hình.

## Bước 5: Kiểm thử giới hạn bảo mật

Viết kiểm thử tự động cho vòng đời plugin, kiểm tra quyền và dữ liệu đầu vào không hợp lệ. Bổ sung các trường hợp phải bị từ chối: truy cập tổ chức khác, dùng quyền chưa được phê duyệt hoặc gọi API ngoài phạm vi SDK hỗ trợ.

Chạy kiểm tra kiểu dữ liệu, kiểm tra quy tắc mã nguồn (lint) và các bài kiểm thử của dự án. Sửa toàn bộ lỗi trước khi đóng gói.

## Bước 6: Tạo gói phát hành

1. Để `zcms pack` ở mục 5 bên dưới quản lý phiên bản: lệnh đóng gói phiên bản hiện tại rồi tăng phiên bản trong manifest và `package.json`. Dùng `--set-version` nếu cần chỉ định phiên bản cụ thể.
2. Cập nhật `changelog` và mô tả các quyền trong manifest.
3. Biên dịch từ bản mã nguồn sạch bằng tệp khóa phụ thuộc (lockfile) đã lưu trong Git.
4. Nếu chưa có cặp khóa của nhà phát hành, tạo một lần bằng:

   ```bash
   zcms keygen --out ./keys
   ```

5. Tạo thư mục đầu ra rồi đóng gói từ thư mục gốc dự án. CLI tự loại mã nguồn, thư viện phụ thuộc và cấu hình chỉ dùng khi phát triển:

   ```bash
   mkdir -p release

   zcms pack . --kind plugin \
     --key ./keys/publisher-private.pem \
     --pub ./keys/publisher-public.pem \
     --out ./release/hello-plugin-0.1.0.zcms
   ```

6. Xác minh chữ ký của nhà phát hành:

   ```bash
   zcms verify ./release/hello-plugin-0.1.0.zcms
   ```

7. Lưu checksum do `zcms pack` in ra.

`zcms pack` tự loại `src`, `node_modules`, `.git`, `.env`, bản đồ mã nguồn (source map) và cấu hình công cụ biên dịch. CLI sắp xếp tệp và đặt dấu thời gian trong tệp nén về 0 để cùng một đầu vào tạo ra cùng một gói. Khi kiểm tra tính tái lập, dùng `--no-bump` ngay từ lần đóng gói đầu tiên và ở mọi lần so sánh để giữ nguyên phiên bản.

Kết quả cần có `publisher signature : VALID`. Dòng `marketplace signature : not checked` là bình thường vì Marketplace chưa kiểm duyệt và ký thêm. Thành phần thực thi vẫn từ chối gói chỉ có chữ ký của nhà phát hành.

## Bước 7: Gửi gói kiểm duyệt

Xem [Phát hành gói cài đặt](/vi/marketplace/publishing/) để đăng ký nhà phát hành, gửi gói và hoàn tất quy trình kiểm duyệt, ký bổ sung và phát hành trên Marketplace.
