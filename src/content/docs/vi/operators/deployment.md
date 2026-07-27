---
title: Triển khai trên môi trường production
description: Triển khai Z-CMS từ image Docker chính thức, cùng các thành phần và yêu cầu bảo mật khi vận hành.
sidebar:
  order: 1
---

Bạn **không** cần build Z-CMS từ mã nguồn để chạy. Image chính thức đa kiến trúc
(`linux/amd64` + `linux/arm64`) được phát hành trên Docker Hub tại
[`zcms`](https://hub.docker.com/u/zcms) và cập nhật theo mỗi bản release.

## Triển khai bằng image chính thức (khuyến nghị)

Repo [**z-cms-docker-offical-image**](https://github.com/zscontributor/z-cms-docker-offical-image)
là cách nhanh nhất để có một instance đang chạy. Nó cung cấp stack `docker compose`
đầy đủ kéo image chính thức, các cấu hình reverse proxy làm sẵn (Traefik, Caddy,
Nginx, Apache và Portainer), file `.env` chú thích từng biến, và script hỗ trợ tạo
secret cùng seed lần đầu.

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

Để chạy với tên miền công khai kèm HTTPS tự động, chồng thêm một overlay reverse
proxy — ví dụ Traefik:

```bash
docker compose -f docker-compose.yml -f compose/traefik.yml up -d
./scripts/first-run-seed.sh -f docker-compose.yml -f compose/traefik.yml
```

Mỗi proxy định tuyến `/api` → API, `/admin` → trang quản trị, `/zcms-media` →
media, còn lại → site công khai. Hướng dẫn cấu hình, nâng cấp, sao lưu và tăng
cường bảo mật production đầy đủ nằm trong repo đó.

:::tip
Trên production hãy ghim `ZCMS_VERSION` vào một tag release cụ thể (ví dụ `0.1.0`)
để triển khai tái lập được và dễ rollback; `latest` luôn trỏ bản mới nhất.
:::

## Các image được phát hành

| Image | Vai trò |
| --- | --- |
| `zcms/cms-api` | API lõi (giữ thông tin xác thực DB/S3) |
| `zcms/site-runtime` | Site công khai (render code theme — đã tăng cường bảo mật) |
| `zcms/admin-web` | Trang quản trị |
| `zcms/worker` | Job nền |
| `zcms/plugin-runtime` | Sandbox plugin không tin cậy (không giữ credential) |
| `zcms/migrate` | Chạy một lần: migration + đăng ký built-in đã ký |

Một hệ thống đầy đủ còn chạy PostgreSQL, Redis và dịch vụ lưu trữ đối tượng tương
thích S3 (stack compose đã gói sẵn, hoặc trỏ tới nhà cung cấp managed).

## Checklist

- Dùng bộ thông tin xác thực riêng cho từng dịch vụ.
- Bảo đảm vai trò cơ sở dữ liệu của ứng dụng là `NOBYPASSRLS` và không sở hữu bảng.
- Không cấp thông tin xác thực của cơ sở dữ liệu, S3 hoặc phiên đăng nhập cho plugin runtime.
- Cấu hình cố định `MARKETPLACE_PUBLIC_KEY` lấy từ nguồn tin cậy (giá trị mặc định
  `FIRST_PARTY_PUBLIC_KEY` trong `.env.example` đã khớp với image chính thức).
- Bật TLS cho tất cả hostname công khai.
- Chạy migration trước khi chuyển lưu lượng sang phiên bản mới (job `migrate` tự
  làm điều này mỗi lần `up`).
- Thiết lập sao lưu và định kỳ kiểm tra khả năng khôi phục.

:::danger
Không dùng vai trò chủ sở hữu cơ sở dữ liệu trong `APP_DATABASE_URL`. Chủ sở hữu bảng có thể bỏ qua Row-Level Security, làm mất khả năng cô lập tenant.
:::

## Tự build image riêng

Chỉ cần khi bạn fork hoặc tùy biến bản build. Repo phân phối có sẵn workflow GitHub
Actions và `scripts/build-and-push.sh` để build cả sáu image đa kiến trúc từ
monorepo mã nguồn. Một fork thay đổi theme/plugin built-in phải ký lại bằng khóa
riêng của mình và đặt `FIRST_PARTY_PUBLIC_KEY` thành nửa công khai tương ứng ở mọi nơi.
