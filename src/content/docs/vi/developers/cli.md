---
title: Tham chiếu zcms CLI
description: Tạo dự án mẫu, đóng gói, ký và xác minh plugin hoặc theme Z-CMS.
sidebar:
  order: 4
---

`zcms` là công cụ dòng lệnh giúp lập trình viên tạo dự án mẫu, tạo khóa nhà phát hành, đóng gói và xác minh plugin hoặc theme. Công cụ có bốn lệnh chính — `init`, `keygen`, `pack`, `verify` — cùng lệnh trợ giúp `help`. Việc tải gói lên được thực hiện qua Developer Portal, không phải CLI.

## Cài đặt

CLI cần Node.js 22 trở lên. Cài gói chính thức từ npm:

```bash
npm install -g @zcmsorg/cli@latest
```

Gói npm có tên `@zcmsorg/cli`; sau khi cài, bạn dùng lệnh `zcms`.

Chạy `zcms` không kèm tham số để xác nhận đã cài thành công và xem các lệnh hỗ trợ.

## Luồng sử dụng nhanh

Ví dụ sau tạo dự án, biên dịch, ký và xác minh một plugin mới:

```bash
zcms init ./hello --kind plugin --id com.acme.plugin.hello
cd hello

pnpm install
pnpm build
pnpm typecheck
pnpm test

# Chỉ chạy một lần cho mỗi nhà phát hành.
zcms keygen --out ./keys

# CLI không tự tạo thư mục cha của file output.
mkdir -p release

zcms pack . --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/hello-0.1.0.zcms

zcms verify ./release/hello-0.1.0.zcms
```

Khi `verify` báo `publisher signature : VALID`, nội dung gói khớp checksum và chữ ký nhà phát hành hợp lệ. Bạn có thể gửi gói đi kiểm duyệt; gói chỉ cài được qua Marketplace sau khi được phê duyệt và có thêm chữ ký của Marketplace.

## Các lệnh hỗ trợ

```text
zcms init [<dir>] [--kind theme|plugin] [--id <reverse.dns.id>] [--name <name>]
          [--description <text>] [--author <name>] [--author-url <url>]
          [--version <semver>] [--yes]
zcms keygen [--out <dir>]
zcms pack <dir> --kind theme|plugin --key <private.pem> --pub <public.pem>
          [--bump patch|minor|major] [--no-bump] [--set-version <semver>]
          [--operator-key <private.pem>] [--out <file>]
zcms verify [<file.zcms>] [--marketplace-key <public.pem>]
zcms help [--lang en|ja|vi]
```

Chạy `zcms` không kèm lệnh con để xem hướng dẫn sử dụng.

### Trợ giúp và ngôn ngữ

`zcms help` hiển thị hướng dẫn ở trên. Chạy `zcms` không kèm lệnh con, `zcms -h`, `zcms -help` hoặc `zcms --help` cũng cho kết quả tương tự. Phần trợ giúp hỗ trợ tiếng Anh, tiếng Nhật và tiếng Việt:

```bash
zcms help --lang vi      # Tiếng Việt
zcms help --lang ja      # 日本語  (--lang JP và --lang VN cũng được chấp nhận)
```

Nếu không truyền `--lang`, CLI lấy ngôn ngữ từ `ZCMS_LANG`, sau đó từ thiết lập ngôn ngữ của shell (`LANG`); nếu đều không có thì dùng tiếng Anh. Chỉ nội dung trợ giúp được dịch. Kết quả biên dịch, checksum và chi tiết lỗi giữ nguyên ở mọi ngôn ngữ.

## 1. Tạo dự án mẫu

```bash
zcms init
```

Khi chạy trong terminal, `init` hỏi các thông tin còn thiếu rồi tạo dự án gồm manifest, mã nguồn, tập lệnh biên dịch và kiểm thử. Thư mục đích phải chưa tồn tại hoặc đang trống; CLI không ghi đè mã nguồn đã có.

ID gói phải viết thường theo dạng tên miền đảo ngược (reverse-DNS), gồm ít nhất ba phần và nên bắt đầu bằng tên miền bạn kiểm soát. Ví dụ: `com.acme.plugin.hello` hoặc `com.acme.theme.corporate`.

Để tạo dự án mà không phải trả lời từng câu hỏi, truyền `--yes` cùng các tùy chọn cần thiết. Cách này phù hợp khi chạy bằng tập lệnh hoặc CI:

```bash
zcms init ./hello --yes --kind plugin \
  --id com.acme.plugin.hello \
  --name "Hello" \
  --description "Adds a content helper." \
  --author "Acme" \
  --author-url "https://acme.example"
```

Khi dùng `--yes` hoặc chạy trong môi trường không tương tác như CI, bạn phải truyền `--kind` và `--id`. Những tùy chọn khác dùng giá trị mặc định nếu bị bỏ qua; phiên bản mặc định là `0.1.0`.

Một plugin sinh ra như sau:

```text
hello/
├── plugin.json          # manifest — identity, permission, settings form
├── package.json
├── build.mjs            # esbuild -> MỘT file CommonJS duy nhất
├── tsconfig.json
├── src/index.ts         # filter, action, job, setup
├── test/plugin.test.ts
├── README.md
└── .gitignore           # đã ignore *.pem — xem bên dưới
```

Theme có cấu trúc tương tự, với `theme.json`, `src/index.tsx` (bố cục, mẫu trang, khối nội dung) và `src/theme.css`.

### Vì sao nên bắt đầu từ dự án mẫu?

Có hai yêu cầu về tệp đầu ra cần được đáp ứng khi tiện ích chạy trên website thực tế. Nếu cấu hình sai, quá trình biên dịch, kiểm thử, đóng gói, ký và cài đặt vẫn có thể thành công, nhưng tiện ích sẽ lỗi khi kích hoạt. Dự án do `init` tạo đã cấu hình sẵn hai yêu cầu này.

| Loại | Yêu cầu | Nếu cấu hình sai |
| --- | --- | --- |
| Plugin | Đầu ra là một tệp CommonJS duy nhất; module bên ngoài duy nhất do sandbox cung cấp là `@zcmsorg/plugin-sdk`. | Khi đầu ra gồm nhiều tệp, sandbox không phân giải được `require()` tương đối. `build.mjs` đã cấu hình gộp mã nguồn thành một tệp. |
| Theme | Tệp đầu vào là ES module có đuôi `.mjs`; React phải để ở dạng external, không gộp vào theme. | Sai định dạng module có thể gây lỗi "Cannot use import statement outside a module" và khiến runtime chuyển sang theme mặc định. Gộp thêm React có thể gây lỗi "invalid hook call" khi chạy bản phát hành. |

### Vòng lặp phát triển

```bash
cd hello
pnpm install
pnpm build       # plugin -> dist/index.js   theme -> dist/index.mjs + dist/theme.css
pnpm typecheck
pnpm test
```

## 2. Tạo cặp khóa cho nhà phát hành

```bash
zcms keygen --out ./keys
```

Lệnh tạo hai tệp trong thư mục `./keys`:

- `publisher-private.pem`: khóa riêng, chỉ chủ sở hữu có quyền đọc và ghi (`0600`).
- `publisher-public.pem`: khóa công khai để đăng ký tại [Developer Portal](https://marketplace.z-cms.org/developer/publisher).

Chỉ tạo cặp khóa một lần cho mỗi nhà phát hành, không tạo lại cho từng phiên bản. CLI từ chối ghi đè khóa riêng và khóa công khai đã tồn tại để tránh mất khóa hoặc tạo cặp khóa không khớp. Hãy trỏ `--out` tới thư mục trống.

`publisher-private.pem` cho phép ký gói dưới danh nghĩa nhà phát hành. Nếu khóa bị lộ, người khác có thể giả mạo chữ ký của bạn. Hãy sao lưu ở nơi an toàn ngoài kho mã nguồn, không gửi qua hội thoại hoặc ghi vào nhật ký CI. `.gitignore` của dự án mẫu và bộ đóng gói đều loại tệp khóa, nhưng không bảo vệ được khóa đã bị sao chép ra ngoài.

## 3. Chuẩn bị thư mục đóng gói

Đặt manifest ở thư mục gốc mà bạn muốn đóng gói:

- `plugin.json` khi dùng `--kind plugin`
- `theme.json` khi dùng `--kind theme`

Manifest cần các trường `id`, `name`, `version`, `author` và `engine`. Trường `entry` phải trỏ tới tệp đã biên dịch và đang tồn tại: `dist/index.js` với plugin, `dist/index.mjs` với theme.

Luôn chạy `pnpm build` trước khi đóng gói. Với dự án tạo bằng `zcms init`, bạn có thể chạy `zcms pack .` ngay tại thư mục gốc, không cần sao chép `dist` sang nơi khác. CLI tự loại các tệp sau:

- **Khóa và thông tin xác thực:** `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`, `id_*`, `.npmrc`.
- **Cấu hình bí mật và thư mục quản lý mã:** `.env*`, `.git`, `node_modules`.
- **Tệp chỉ dùng khi phát triển:** `src`, `test/`, tập lệnh biên dịch, `tsconfig*.json`, cấu hình công cụ và bản đồ mã nguồn (source map).

Các tệp `*.pem` luôn bị loại khỏi gói, kể cả khóa trong `./keys`. Dù vậy, vẫn phải giữ khóa riêng ngoài Git, không gửi qua hội thoại và không in nội dung khóa vào nhật ký CI.

## 4. Đóng gói và ký tiện ích bằng khóa nhà phát hành

Tham số đầu tiên là đường dẫn tới thư mục plugin hoặc theme cần phát hành. `pack` chỉ đóng gói thư mục đó và ký nội dung gói. Dùng `.` nếu terminal đang ở đúng thư mục, hoặc chỉ định đường dẫn cụ thể:

```bash
mkdir -p release

# một plugin, theo đường dẫn
zcms pack ./plugins/seo-toolkit --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/seo-toolkit-1.0.0.zcms

# một theme, theo đường dẫn
zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/corporate-1.0.0.zcms
```

`--kind` phải khớp manifest: `plugin.json` dùng `--kind plugin`, `theme.json` dùng `--kind theme`. Nếu không có `--out`, CLI tạo `<manifest.id>-<manifest.version>.zcms` trong thư mục hiện tại. Xem [Phát hành gói cài đặt](/vi/marketplace/publishing/) để biết quy trình đóng gói, ký và gửi kiểm duyệt.

Nếu dùng `--out`, hãy tạo trước thư mục cha, chẳng hạn `./release`. CLI chỉ tạo tệp `.zcms`, không tự tạo thư mục cha.

Lệnh in ra ID gói, phiên bản, kích thước tệp và checksum. Gói đã có chữ ký nhà phát hành, nhưng cần Marketplace kiểm duyệt và ký thêm trước khi cài qua Marketplace.

### Tự động tăng phiên bản

Không cần tự tăng phiên bản giữa các lần phát hành. `pack` đóng gói phiên bản hiện tại trong manifest, rồi tăng phiên bản và ghi lại vào `theme.json` hoặc `plugin.json`, cùng `package.json` nếu có. Ví dụ, dự án đang ở `0.1.0` sẽ tạo gói `0.1.0`; sau đó manifest được cập nhật thành `0.1.1` để chuẩn bị cho lần phát hành tiếp theo:

```bash
zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem --pub ./keys/publisher-public.pem
# version : packed 1.0.0; theme.json advanced to 1.0.1 for the next pack
```

Các tùy chọn điều khiển cách tăng phiên bản:

| Tùy chọn | Tác dụng |
| --- | --- |
| Không chỉ định | Đóng gói phiên bản hiện tại rồi tăng số patch. |
| `--bump minor` / `--bump major` | Tăng số minor hoặc major thay cho patch sau khi đóng gói. |
| `--set-version <semver>` | Đóng gói phiên bản được chỉ định; vẫn tăng phiên bản sau đó nếu không kèm `--no-bump`. |
| `--no-bump` | Đóng gói phiên bản hiện tại và giữ nguyên manifest. |

Tên tệp `<manifest.id>-<manifest.version>.zcms` dùng phiên bản đã đóng gói, không phải phiên bản vừa tăng. Nếu đóng gói thất bại, phiên bản được khôi phục về giá trị trước đó.

### Chữ ký để cài trực tiếp trên hệ thống tự vận hành

Nếu chỉ phát hành trên Marketplace, bạn có thể bỏ qua phần này. Nếu tự vận hành Z-CMS và cần cài tiện ích mà không qua Marketplace (sideload), thêm `--operator-key`:

```bash
zcms pack . --kind theme \
  --key ./op-private.pem --pub ./op-public.pem \
  --operator-key ./op-private.pem
```

Lệnh thêm chữ ký thứ hai của đơn vị vận hành. Hệ thống cần cấu hình cố định khóa công khai tương ứng trong `OPERATOR_PUBLIC_KEY`; với theme, còn cần `ALLOW_THEME_SIDELOAD=true`. Quản trị viên tải gói lên tại **Admin → Appearance → Install from file** và phê duyệt trước khi sử dụng. Dùng cùng cặp khóa của đơn vị vận hành cho `--key`/`--pub`. Gói này dành cho cài đặt trực tiếp, không dùng để gửi lên Marketplace.

## 5. Xác minh trước khi gửi

```bash
zcms verify ./release/example-plugin-1.0.0.zcms
```

Nếu không chỉ định tệp, `zcms verify` chọn tệp `.zcms` mới nhất trong thư mục hiện tại. Bạn không cần nhập lại tên tệp mỗi khi phiên bản thay đổi.

Không truyền `--marketplace-key` ở bước này. CLI kiểm tra checksum và chữ ký nhà phát hành, đồng thời hiển thị `marketplace signature : not checked`. Đây là kết quả bình thường với gói chưa gửi lên Marketplace.

Nếu chữ ký nhà phát hành báo `INVALID`, không tải tệp lên. Biên dịch và đóng gói lại từ mã nguồn sạch, rồi xác minh đúng tệp đầu ra. CLI trả mã thoát khác `0` khi xác minh thất bại, nên có thể dùng lệnh này trong CI.

## 6. Xác minh gói tải từ Marketplace

Với tệp `.zcms` đã được Marketplace phê duyệt, dùng khóa công khai chính thức của Marketplace để kiểm tra cả chữ ký nhà phát hành và chữ ký Marketplace:

```bash
zcms verify ./downloaded-package.zcms \
  --marketplace-key ./marketplace-public.pem
```

`marketplace-public.pem` là khóa công khai của Marketplace, không phải `publisher-public.pem` do `zcms keygen` tạo. Khi cả hai chữ ký đều báo `VALID`, gói có đủ chữ ký để cài đặt. CLI chỉ đọc và xác minh gói, không chạy mã bên trong.

## 7. Tải lên để kiểm duyệt

CLI không có lệnh `zcms publish`. Tải đúng tệp `.zcms` vừa xác minh lên [**Developer Portal → Submit a package**](https://marketplace.z-cms.org/developer/submit).

Nếu cần tự động hóa qua API, xem phần tải lên trong [Phát hành gói cài đặt](/vi/marketplace/publishing/). Không biên dịch hoặc đóng gói lại sau khi xác minh; chỉ tải lên đúng tệp đã kiểm tra.

## Các lỗi thường gặp

| Thông báo hoặc hiện tượng | Nguyên nhân và cách xử lý |
| --- | --- |
| `Nothing to ask with` | Dùng `--yes` hoặc chạy trong CI nhưng thiếu `--kind` hay `--id`. Truyền đủ hai tùy chọn này. |
| `Missing plugin.json` hoặc `Missing theme.json` | `<dir>` không trỏ tới thư mục gốc của gói, hoặc `--kind` không khớp loại manifest. |
| `Entry ... does not exist` | Chưa biên dịch hoặc `entry` sai. Chạy `pnpm build` và kiểm tra tệp trong `dist`. |
| Không tạo được tệp trong `./release` | Chạy `mkdir -p release` trước khi dùng `--out ./release/...`. |
| Chữ ký Marketplace báo `INVALID` với gói vừa tạo | Gói chưa được Marketplace ký thêm. Khi xác minh trước khi gửi, không truyền `--marketplace-key`. |
