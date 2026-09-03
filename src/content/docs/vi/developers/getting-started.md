---
title: Bắt đầu phát triển
description: Thiết lập môi trường phát triển Z-CMS.
sidebar:
  order: 1
---

Mã nguồn Z-CMS được tổ chức trong một kho chung (monorepo), viết bằng TypeScript và sử dụng Node.js, pnpm, Next.js, NestJS, PostgreSQL cùng Redis.

## Yêu cầu

- Node.js 22+
- pnpm 10+
- Docker

## Chạy dự án trên máy cá nhân

```bash
cp .env.example .env
pnpm install
pnpm bootstrap
pnpm dev
```

Trước khi gửi thay đổi, hãy chạy:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
```

`pnpm verify` kiểm tra các yêu cầu bảo mật quan trọng: tách biệt dữ liệu giữa các tổ chức (tenant), ngăn plugin vượt ra ngoài sandbox và xác minh chữ ký gói cài đặt.

## Phát triển tiện ích mở rộng

Bạn không cần tải toàn bộ mã nguồn Z-CMS để viết plugin hoặc theme. Hãy cài CLI rồi tạo dự án mẫu:

```bash
npm install -g @zcmsorg/cli@latest
zcms init
```

`init` hỏi bạn muốn tạo plugin hay theme, sau đó tạo dự án với cấu hình biên dịch, kiểm tra kiểu dữ liệu, kiểm thử, đóng gói và ký. Dự án mẫu cũng đáp ứng sẵn các yêu cầu về định dạng tệp đầu ra mà bạn cần lưu ý khi chạy trên website thực tế.

Sau đó chọn quy trình phù hợp với phần bạn muốn phát triển:

- [Tạo plugin](/vi/developers/plugin-handbook/getting-started/)
- [Tạo theme](/vi/developers/theme-handbook/getting-started/)
- [Tạo dự án mẫu, đóng gói và xác minh bằng `zcms`](/vi/developers/cli/)
- [Gửi gói cài đặt để Marketplace kiểm duyệt](/vi/marketplace/publishing/)
