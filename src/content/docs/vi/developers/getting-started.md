---
title: Bắt đầu phát triển
description: Thiết lập môi trường phát triển Z-CMS.
sidebar:
  order: 1
---

Z-CMS là monorepo TypeScript sử dụng Node.js, pnpm, Next.js, NestJS, PostgreSQL và Redis.

## Yêu cầu

- Node.js 22+
- pnpm 10+
- Docker

## Chạy project trên máy local

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

`pnpm verify` kiểm tra các yêu cầu bảo mật quan trọng, bao gồm khả năng cô lập tenant, ngăn thoát khỏi sandbox và xác minh chữ ký package.

## Phát triển extension

Bạn không cần checkout repository này để viết plugin hay theme. Chỉ cần cài CLI và scaffold:

```bash
npm install -g @zcmsorg/cli@latest
zcms init
```

`init` hỏi bạn đang xây plugin hay theme, rồi tạo project có sẵn cấu hình build, kiểm tra kiểu dữ liệu, test, đóng gói và ký. Project cũng đáp ứng hai yêu cầu chỉ được kiểm tra khi extension chạy trên website thực tế.

Sau đó chọn quy trình phù hợp với phần bạn muốn phát triển:

- [Tạo plugin](/vi/developers/plugin-handbook/getting-started/)
- [Tạo theme](/vi/developers/theme-handbook/getting-started/)
- [Tạo project mẫu, đóng gói và xác minh bằng `zcms`](/vi/developers/cli/)
- [Gửi package để Marketplace kiểm duyệt](/vi/marketplace/publishing/)
