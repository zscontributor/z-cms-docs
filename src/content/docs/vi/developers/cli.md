---
title: Tham chiếu zcms CLI
description: Scaffold, đóng gói và ký theme/plugin cho Z-CMS.
sidebar:
  order: 4
---

`zcms` giúp developer tạo project mẫu, tạo khóa cho nhà phát hành, đóng gói và kiểm tra plugin hoặc theme. CLI có bốn command — `init`, `keygen`, `pack` và `verify` — cùng với `help`. Việc tải package lên được thực hiện trên Developer Portal, không phải bằng CLI.

## Cài đặt

CLI yêu cầu Node.js 22 trở lên. Cài package chính thức từ npm:

```bash
npm install -g @zcmsorg/cli@latest
```

Package tên là `@zcmsorg/cli`; lệnh nó cài ra là `zcms`.

Chạy `zcms` không kèm tham số để kiểm tra CLI đã được cài và xem danh sách command có thể sử dụng.

## Luồng sử dụng nhanh

Ví dụ dưới đây tạo, build, ký và kiểm tra một plugin mới:

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

Khi `verify` báo `publisher signature : VALID`, nội dung package khớp với checksum và chữ ký của nhà phát hành hợp lệ; lúc này bạn có thể tải lên để kiểm duyệt. Package vẫn chưa cài được cho đến khi Marketplace phê duyệt và thêm chữ ký của Marketplace.

## Tổng quan command

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

Chạy `zcms` không kèm command để xem hướng dẫn sử dụng này.

### Trợ giúp và ngôn ngữ

`zcms help` in ra phần hướng dẫn ở trên; `zcms` không kèm command, `zcms -h`, `zcms -help` và `zcms --help` cũng vậy. Nội dung trợ giúp có sẵn bằng tiếng Anh, tiếng Nhật và tiếng Việt:

```bash
zcms help --lang vi      # Tiếng Việt
zcms help --lang ja      # 日本語  (--lang JP và --lang VN cũng được chấp nhận)
```

Nếu không có `--lang`, ngôn ngữ được đọc từ `ZCMS_LANG`, rồi tới locale của shell (`LANG`), và nếu không có thì mặc định là tiếng Anh. Chỉ phần trợ giúp được dịch — kết quả build, checksum và chi tiết lỗi giống nhau trong mọi ngôn ngữ.

## 1. Tạo project mẫu

```bash
zcms init
```

Khi chạy trong terminal, `init` hỏi các thông tin còn thiếu rồi tạo project mẫu có sẵn manifest, source, script build và test. Thư mục đích phải chưa tồn tại hoặc đang trống; CLI không ghi đè source code đã có.

Package ID phải viết thường theo dạng reverse-DNS, có ít nhất ba phần và nên bắt đầu bằng domain bạn kiểm soát. Ví dụ: `com.acme.plugin.hello` hoặc `com.acme.theme.corporate`.

Nếu muốn CLI tạo project ngay mà không hỏi từng thông tin, hãy truyền `--yes` cùng đầy đủ các option cần thiết. Cách này phù hợp khi chạy bằng script hoặc trong CI:

```bash
zcms init ./hello --yes --kind plugin \
  --id com.acme.plugin.hello \
  --name "Hello" \
  --description "Adds a content helper." \
  --author "Acme" \
  --author-url "https://acme.example"
```

Khi dùng `--yes` hoặc chạy trong môi trường không có terminal tương tác như CI, bạn bắt buộc phải truyền `--kind` và `--id`. Nếu bỏ qua các option khác, CLI dùng giá trị mặc định; version mặc định là `0.1.0`.

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

Theme có cấu trúc tương tự, với `theme.json`, `src/index.tsx` (Layout, template, block) và `src/theme.css`.

### Vì sao scaffold lại quan trọng

Có hai yêu cầu chỉ được kiểm tra khi extension chạy trên website thực tế, không phải trong lúc build. Nếu cấu hình sai, extension vẫn có thể build, test, đóng gói, ký và cài đặt thành công nhưng sẽ báo lỗi khi được kích hoạt. Project do `init` tạo đã đáp ứng sẵn cả hai yêu cầu này.

| | Yêu cầu | Điều gì xảy ra nếu làm sai |
| --- | --- | --- |
| **Plugin** | Output phải là **một tệp CommonJS duy nhất**. Sandbox chỉ cung cấp module `@zcmsorg/plugin-sdk`. | Nếu output gồm nhiều tệp, sandbox không thể xử lý `require()` tương đối và plugin sẽ lỗi khi được kích hoạt. `build.mjs` đã được cấu hình để gộp source thành một tệp. |
| **Theme** | Entry là **ESM**, và file phải là **`.mjs`**. React phải **external**. | `dist/index.js` lấy module format từ `"type"` trong `package.json` gần nhất — mà `package.json` lại nằm trong package. Đoán sai thì `site-runtime` ném "Cannot use import statement outside a module", bắt lỗi, rồi **âm thầm quay về default theme**. Bundle thêm một bản React thứ hai thì bạn nhận "invalid hook call", chỉ ở production. |

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

Command tạo hai tệp trong thư mục `./keys`:

- `publisher-private.pem`, chỉ owner được đọc (`0600`)
- `publisher-public.pem`, dùng để đăng ký trong [Developer Portal](https://marketplace.z-cms.org/developer/publisher)

Chỉ tạo cặp khóa một lần cho mỗi nhà phát hành, không tạo khóa mới cho từng phiên bản. CLI từ chối ghi đè bất kỳ tệp khóa nào đã tồn tại — cả khóa riêng lẫn khóa công khai: ghi đè khóa riêng khiến mọi package từng ký bằng nó bị mồ côi, còn ghi đè riêng nửa khóa công khai sẽ để lại một cặp khóa không khớp. Hãy trỏ `--out` tới một thư mục trống.

`publisher-private.pem` **chính là danh tính của bạn**. Ai có nó đều có thể ký package dưới danh nghĩa bạn, và một khi nó lộ ra thì mọi package bạn từng ký đều phải bị coi là có thể giả mạo. Hãy backup ở nơi không phải là một repository. `.gitignore` do scaffold sinh ra đã loại `*.pem`, và packer không bao giờ đưa key material vào package (xem bên dưới) — nhưng không cơ chế nào cứu được bạn nếu bạn dán nó vào một khung chat hay một CI log.

## 3. Chuẩn bị thư mục package

Manifest nằm ở root của thư mục bạn pack:

- `plugin.json` khi dùng `--kind plugin`
- `theme.json` khi dùng `--kind theme`

Manifest phải có `id`, `name`, `version`, `author` và `engine`. Trường `entry` trỏ tới tệp đã build và tệp đó phải tồn tại trước khi đóng gói — `dist/index.js` với plugin, `dist/index.mjs` với theme.

Luôn chạy `pnpm build` trước khi pack. Một project do `zcms init` tạo có thể pack trực tiếp từ project root bằng `zcms pack .`; không cần tự copy `dist` sang một thư mục khác. Packer tự loại khỏi package các file chỉ dùng khi phát triển:

- **key material**: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`, `id_*`, và `.npmrc`
- **secret và VCS**: `.env*`, `.git`, `node_modules`
- **chỉ dùng khi dev**: `src`, `test/`, build script, `tsconfig*.json`, tool config, source map

Vì `*.pem` luôn bị loại, thư mục `./keys` không được đưa vào file `.zcms`. Dù vậy, vẫn phải giữ private key ngoài Git, không gửi qua chat và không in nội dung key vào CI log.

## 4. Đóng gói và ký extension bằng khóa của nhà phát hành

Tham số đầu tiên là **đường dẫn tới theme hoặc plugin cần đóng gói** — `pack` sẽ nén đúng thư mục đó và ký lên nó. Dùng `.` khi shell của bạn đang ở trong thư mục đó, hoặc trỏ thẳng tới nó:

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

`--kind` phải khớp với manifest ở đường dẫn đó (`plugin.json` → `--kind plugin`, `theme.json` → `--kind theme`). Nếu bỏ `--out`, CLI tạo `<manifest.id>-<manifest.version>.zcms` trong thư mục hiện tại. Xem [Phát hành package](/vi/marketplace/publishing/) để biết toàn bộ quy trình sign–pack–submit.

Nếu dùng `--out`, thư mục cha như `./release` phải tồn tại trước khi chạy command; CLI chỉ tạo file `.zcms`, không tự tạo thư mục cha.

Command in ra ID package, phiên bản, kích thước tệp và checksum. Package này đã có chữ ký của nhà phát hành nhưng chưa thể cài đặt cho đến khi Marketplace kiểm duyệt và thêm chữ ký.

### Version tự tăng

Bạn không tự sửa version bằng tay giữa các lần phát hành. `pack` đóng gói đúng version mà manifest đang khai báo, rồi tăng version đó lên và ghi lại vào `theme.json`/`plugin.json` — và vào `package.json` nếu file này tồn tại, để hai bên không bao giờ lệch nhau. Vì vậy một project vừa scaffold ở `0.1.0` sẽ được pack **thành** `0.1.0`, còn manifest được để lại ở `0.1.1`, sẵn sàng cho lần pack tiếp theo:

```bash
zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem --pub ./keys/publisher-public.pem
# version : packed 1.0.0; theme.json advanced to 1.0.1 for the next pack
```

Ba flag ghi đè hành vi mặc định:

| Flag | Tác dụng |
| --- | --- |
| *(none)* | đóng gói version hiện tại, rồi tăng số **patch** |
| `--bump minor` / `--bump major` | tăng số minor hoặc major thay vì patch |
| `--set-version <semver>` | đóng gói một version chính xác (vẫn tăng version sau đó trừ khi có thêm `--no-bump`) |
| `--no-bump` | đóng gói version hiện tại và giữ nguyên manifest |

Tên file output `<manifest.id>-<manifest.version>.zcms` dùng version *đã được đóng gói*, không phải version đã tăng. Nếu pack thất bại, version được rollback — một lần pack thất bại không bao giờ để lại một lần tăng version dở dang.

### Chữ ký sideload (chỉ cho self-hosted)

Nhà phát hành lên Marketplace có thể bỏ qua phần này. Nếu bạn tự vận hành instance Z-CMS **của riêng mình** và muốn cài extension mà không qua Marketplace, hãy thêm `--operator-key`:

```bash
zcms pack . --kind theme \
  --key ./op-private.pem --pub ./op-public.pem \
  --operator-key ./op-private.pem
```

Lệnh này đóng thêm một chữ ký thứ hai — chữ ký **operator**. Một instance có runtime ghim `OPERATOR_PUBLIC_KEY` tương ứng — và với theme thì đặt `ALLOW_THEME_SIDELOAD=true` — sẽ chạy package sau khi admin tải lên tại **Admin → Appearance → Install from file** rồi phê duyệt, hoàn toàn không cần Marketplace. Dùng cùng một cặp khóa operator cho `--key`/`--pub`. Package ký theo cách này dành cho sideload, không phải để gửi lên Marketplace.

## 5. Xác minh trước khi gửi

```bash
zcms verify ./release/example-plugin-1.0.0.zcms
```

Khi gọi mà không kèm file, `zcms verify` chọn file `.zcms` mới nhất trong thư mục hiện tại — tiện lợi vì tên file được pack thay đổi mỗi lần version tăng lên, nên bạn hiếm khi phải gõ đầy đủ tên file.

Ở bước này không truyền `--marketplace-key`. CLI kiểm tra checksum và publisher signature, nhưng sẽ hiển thị `marketplace signature : not checked`. Đây là kết quả bình thường đối với package vừa được bạn pack và chưa gửi lên Marketplace.

Nếu chữ ký của nhà phát hành là `INVALID`, không tải tệp lên. Hãy build và đóng gói lại từ source sạch, sau đó kiểm tra đúng tệp đầu ra vừa tạo. Khi xác minh thất bại, CLI trả về exit code khác `0`, vì vậy có thể dùng command này trong CI.

## 6. Verify package từ Marketplace

Phần này chỉ áp dụng cho file `.zcms` đã được Marketplace approve. Dùng public key chính thức của Marketplace để kiểm tra cả publisher signature và Marketplace signature:

```bash
zcms verify ./downloaded-package.zcms \
  --marketplace-key ./marketplace-public.pem
```

`marketplace-public.pem` là key của Marketplace, không phải file `publisher-public.pem` do `zcms keygen` tạo. Khi cả hai dòng đều báo `VALID`, package có chữ ký đầy đủ và có thể cài đặt. CLI chỉ đọc và kiểm tra package; nó không execute code bên trong.

## 7. Tải lên để kiểm duyệt

CLI không có command `zcms publish`. Hãy upload đúng file `.zcms` vừa verify tại [**Developer Portal → Submit a package**](https://marketplace.z-cms.org/developer/submit).

Nếu cần tự động hóa bằng API, xem phần tải lên trong [Phát hành package](/vi/marketplace/publishing/). Không build hoặc đóng gói lại sau khi xác minh; file tải lên phải chính là file vừa được kiểm tra.

## Các lỗi thường gặp

| Thông báo hoặc hiện tượng | Nguyên nhân và cách xử lý |
| --- | --- |
| `Nothing to ask with` | Bạn đang dùng `--yes` hoặc chạy trong CI nhưng thiếu `--kind` hay `--id`. Truyền đủ hai option này. |
| `Missing plugin.json` hoặc `Missing theme.json` | Tham số `<dir>` không trỏ tới package root, hoặc `--kind` không đúng loại manifest. |
| `Entry ... does not exist` | Chưa build package hoặc trường `entry` trong manifest sai. Chạy `pnpm build` và kiểm tra tệp trong `dist`. |
| Không tạo được file trong `./release` | Chạy `mkdir -p release` trước khi dùng `--out ./release/...`. |
| Marketplace signature là `INVALID` với package vừa pack | Package của bạn chưa được Marketplace co-sign. Verify trước khi submit mà không truyền `--marketplace-key`. |
