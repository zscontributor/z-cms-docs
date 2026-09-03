---
title: Triển khai hệ thống chạy thực tế
description: Triển khai Z-CMS bằng Docker image chính thức và kiểm tra các yêu cầu bảo mật trước khi vận hành.
sidebar:
  order: 1
---

Bạn không cần tự biên dịch Z-CMS từ mã nguồn. Docker image chính thức hỗ trợ `linux/amd64` và `linux/arm64`, được cung cấp tại [`zcms`](https://hub.docker.com/u/zcms) trên Docker Hub và cập nhật theo từng bản phát hành.

## Triển khai bằng image chính thức (khuyến nghị)

Kho [**z-cms-docker-offical-image**](https://github.com/zscontributor/z-cms-docker-offical-image) cung cấp bộ cấu hình để khởi chạy Z-CMS bằng image chính thức. Trong đó có cấu hình `docker compose`, các lựa chọn reverse proxy (Traefik, Caddy, Nginx, Apache và Portainer), tệp `.env` có chú thích và tập lệnh tạo khóa bí mật, khởi tạo dữ liệu lần đầu.

```bash
git clone https://github.com/zscontributor/z-cms-docker-offical-image.git zcms
cd zcms

# 1. Tạo .env với secret ngẫu nhiên mạnh
cp .env.example .env
./scripts/generate-secrets.sh --write

# 2. Khởi động stack (kéo zcms/* từ Docker Hub)
docker compose up -d

# 3. Tạo admin đầu tiên + site demo (chạy một lần)
./scripts/first-run-seed.sh
```

Để dùng tên miền công khai và HTTPS tự động, kết hợp thêm tệp cấu hình reverse proxy, chẳng hạn Traefik:

```bash
docker compose -f docker-compose.yml -f compose/traefik.yml up -d
./scripts/first-run-seed.sh -f docker-compose.yml -f compose/traefik.yml
```

Reverse proxy chuyển `/api` tới API, `/admin` tới trang quản trị, `/zcms-media` tới dịch vụ hình ảnh và tệp; các đường dẫn còn lại tới website công khai. Xem kho mã trên để biết hướng dẫn cấu hình, nâng cấp, sao lưu và tăng cường bảo mật.

:::tip
Trên hệ thống chạy thực tế, hãy đặt `ZCMS_VERSION` thành một nhãn phiên bản cụ thể, ví dụ `0.1.0`, để có thể triển khai lại cùng phiên bản hoặc quay lại bản trước. Nhãn `latest` luôn theo bản phát hành mới nhất.
:::

## Các image được phát hành

| Image | Vai trò |
| --- | --- |
| `zcms/cms-api` | API lõi, giữ thông tin xác thực cơ sở dữ liệu và S3 |
| `zcms/site-runtime` | Hiển thị website công khai bằng mã theme trong môi trường đã tăng cường bảo mật |
| `zcms/admin-web` | Trang quản trị |
| `zcms/worker` | Xử lý tác vụ nền |
| `zcms/plugin-runtime` | Chạy plugin trong sandbox, không giữ thông tin xác thực |
| `zcms/migrate` | Chạy một lần để chuyển đổi cấu trúc dữ liệu và đăng ký các gói tích hợp sẵn đã ký |

Hệ thống còn cần PostgreSQL, Redis và bộ lưu trữ đối tượng tương thích S3. Bạn có thể dùng các dịch vụ trong bộ cấu hình Compose hoặc kết nối tới dịch vụ do nhà cung cấp quản lý.

## Kiểm tra trước khi vận hành

- Dùng thông tin xác thực riêng cho từng dịch vụ.
- Bảo đảm vai trò cơ sở dữ liệu của ứng dụng là `NOBYPASSRLS` và không sở hữu bảng.
- Không cấp thông tin xác thực cơ sở dữ liệu, S3 hoặc phiên đăng nhập cho môi trường thực thi plugin.
- Cấu hình cố định `MARKETPLACE_PUBLIC_KEY` từ nguồn tin cậy. Giá trị `FIRST_PARTY_PUBLIC_KEY` mặc định trong `.env.example` đã khớp image chính thức.
- Bật TLS cho mọi tên máy chủ công khai.
- Chạy chuyển đổi cấu trúc dữ liệu (migration) trước khi chuyển lưu lượng sang phiên bản mới. Tác vụ `migrate` tự thực hiện bước này mỗi lần chạy `up`.
- Thiết lập sao lưu và định kỳ thử khôi phục.

:::danger
Không dùng vai trò chủ sở hữu cơ sở dữ liệu trong `APP_DATABASE_URL`. Chủ sở hữu bảng có thể bỏ qua Row-Level Security, làm mất khả năng tách biệt dữ liệu giữa các tổ chức.
:::

## Tự tạo Docker image

Chỉ cần tự tạo image khi bạn duy trì bản sao mã nguồn (fork) hoặc tùy chỉnh bản biên dịch. Kho phân phối có quy trình GitHub Actions và `scripts/build-and-push.sh` để tạo sáu image đa kiến trúc từ mã nguồn chung. Nếu sửa theme hoặc plugin tích hợp sẵn, bạn phải ký lại bằng khóa của mình và cấu hình khóa công khai tương ứng trong `FIRST_PARTY_PUBLIC_KEY` ở mọi thành phần liên quan.
