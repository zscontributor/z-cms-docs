---
title: Plugin đầu tiên
description: Cấu trúc và vòng đời cơ bản của một Z-CMS plugin.
sidebar:
  order: 1
---

Plugin chạy trong V8 isolate và chỉ có thể sử dụng những capability đáp ứng đủ ba điều kiện: được khai báo trong manifest, được Administrator phê duyệt và được CMS gateway xác minh.

## Chuẩn bị

Cài Node.js 22+, pnpm 10+ và `zcms` CLI:

```bash
npm install -g @zcmsorg/cli
```

## Bước 1: Tạo project mẫu

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
```

Dùng reverse-DNS id thuộc domain mà bạn kiểm soát. `init` sẽ hỏi những gì bạn không truyền vào, và từ chối ghi vào một thư mục đã có nội dung.

Project được tạo sẵn cấu hình build, kiểm tra kiểu dữ liệu, test, đóng gói và ký:

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

:::caution[Phải build ra một tệp CommonJS duy nhất]
Sandbox là một V8 isolate. Nó chạy **một script CommonJS duy nhất** và chỉ cung cấp module `@zcmsorg/plugin-sdk`. Bên trong không có trình phân giải module, nên output gồm nhiều tệp sẽ chứa `require()` tương đối mà sandbox không thể xử lý. Lỗi chỉ xuất hiện khi plugin được kích hoạt trên website thực tế.

`build.mjs` đã được cấu hình để gộp source thành một tệp. Bạn vẫn có thể chia source thành nhiều tệp, nhưng phải giữ `format: "cjs"` và để SDK ở dạng external.
:::

Phần còn lại của trang này giải thích nội dung các file được sinh ra, để bạn sửa chúng một cách chắc chắn.

## Bước 2: Hoàn thiện manifest

Tạo `plugin.json` tại thư mục gốc của package. Các trường bắt buộc là `id`, `name`, `version`, `author` và `engine`. `entry` mặc định là `dist/index.js`; `permissions` khai báo các phạm vi sẽ được yêu cầu khi kích hoạt.

```json
{
  "id": "com.example.plugin.hello",
  "name": "Hello Plugin",
  "version": "0.1.0",
  "description": "Adds a read-only content helper.",
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

Các trường tùy chọn gồm `scope`, `capabilities`, `media`, `settingsSchema` và `database.tables`. Nên ưu tiên `ctx.storage`; chỉ khai báo bảng quan hệ khi thực sự cần. Tên bảng phải dùng tiền tố riêng của plugin theo quy định của nền tảng.

`scope` khai báo **phạm vi kích hoạt** của plugin và có thể là `"site"` (mặc định) hoặc `"org"`:

- `"site"` — cài và kích hoạt riêng cho từng website. Đây là mặc định, phù hợp với hầu hết plugin (SEO, thương mại, trợ lý AI…).
- `"org"` — cài **một lần cho cả tổ chức (tenant)** và chạy trên **mọi website** thuộc tổ chức đó, giống plugin "network-activated" của WordPress. Quản trị viên quản lý ở màn hình **Plugin tổ chức** riêng.

`scope` là *phạm vi*, không phải *quyền hạn*: một plugin `"org"` vẫn phải được phê duyệt permission ở tầng nó cài, và không bao giờ tự trở thành plugin lõi. Nền tảng đọc `scope` từ manifest **đã ký**, nên một package không thể tự nâng quyền hạn qua trường này. Xem [Theme và plugin](/vi/users/extensions/) để biết cách quản trị viên bật plugin theo từng tầng.

## Bước 3: Implement entrypoint

Implement entrypoint bằng type và API của `@zcmsorg/plugin-sdk`.

- Chỉ dùng API được SDK expose.
- Truy cập nội dung, media và mail qua gateway do SDK cung cấp.
- Xử lý trường hợp một permission tùy chọn không được phê duyệt.
- Lưu secret trong secret store của nền tảng; không bundle secret vào package.
- Không import database package, filesystem API hoặc Node.js built-in module nằm ngoài runtime contract.

## Bước 4: Chạy trên local

Build plugin và khởi động môi trường phát triển Z-CMS. Cài bản build local lên một website kiểm thử, sau đó chỉ kích hoạt plugin cho website đó.

Kiểm tra lần lượt:

1. Plugin load thành công, không có runtime error hoặc schema error.
2. Mỗi chức năng chạy được với tập permission tối thiểu đã document.
3. Plugin xử lý an toàn khi permission bị từ chối.
4. Deactivate plugin sẽ dừng hook và background job đúng cách.
5. Activate lại plugin không tạo trùng job, webhook hoặc cấu hình.

## Bước 5: Test trust boundary

Viết automated test cho plugin lifecycle, permission check và input không hợp lệ. Bổ sung negative test cho các trường hợp truy cập tenant khác, sử dụng permission chưa được phê duyệt và gọi API nằm ngoài SDK contract.

Chạy typecheck, lint và test script của project. Sửa toàn bộ lỗi trước khi đóng gói.

## Bước 6: Build release package

1. Cập nhật version cuối cùng trong manifest và `package.json`.
2. Cập nhật changelog và permission disclosure.
3. Build từ clean checkout bằng lockfile đã commit.
4. Nếu chưa có cặp khóa của nhà phát hành, hãy tạo một lần bằng:

   ```bash
   zcms keygen --out ./keys
   ```

5. Tạo thư mục chứa file output, rồi pack trực tiếp từ project root. CLI tự loại source, dependency và file cấu hình chỉ dùng khi phát triển:

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

`zcms pack` tự loại `src`, `node_modules`, `.git`, `.env`, source map và cấu hình công cụ build. CLI sắp xếp các mục và đưa timestamp của archive về 0 để cùng một thư mục build tạo ra package giống hệt nhau.

Kết quả xác minh ở bước này phải có `publisher signature : VALID`. Dòng `marketplace signature : not checked` là bình thường vì package chưa được Marketplace kiểm duyệt và ký thêm; runtime vẫn từ chối package chỉ có chữ ký của nhà phát hành.

## Bước 7: Submit package

Tiếp tục với [Phát hành package](/vi/marketplace/publishing/) để xác minh nhà phát hành, gửi package, kiểm duyệt, ký và phát hành trên Marketplace.
