---
title: Phát hành package
description: Chuẩn bị và gửi package plugin hoặc theme lên Marketplace để kiểm duyệt.
sidebar:
  order: 2
---

Quy trình này bắt đầu sau khi plugin hoặc theme đã vượt qua các bước kiểm thử trên máy của bạn. Hãy gửi đúng file đã xác minh; không build lại trong quá trình kiểm duyệt.

## Bước 1: Tạo và đăng ký khóa của nhà phát hành

Tạo cặp khóa Ed25519 một lần cho nhà phát hành:

```bash
zcms keygen --out ./keys
```

Command này tạo khóa riêng `publisher-private.pem` với quyền truy cập `0600` và khóa công khai `publisher-public.pem`. Hãy sao lưu khóa riêng ở nơi an toàn; không commit, tải lên hoặc dán khóa này vào biểu mẫu web.

Mở [**Developer Portal → Publisher**](https://marketplace.z-cms.org/developer/publisher) và đăng ký:

1. Slug dài 3–40 ký tự, chỉ gồm chữ thường, số hoặc dấu gạch ngang; không bắt đầu hoặc kết thúc bằng dấu gạch ngang.
2. Display name.
3. Email liên hệ, không bắt buộc.
4. Toàn bộ nội dung của `publisher-public.pem`.

Mỗi khóa công khai chỉ được đăng ký cho một nhà phát hành. Nếu khóa riêng từng bị dán hoặc để lộ, hãy xem khóa đó đã bị xâm phạm và tạo cặp khóa mới.

## Bước 2: Chuẩn bị thông tin giới thiệu

Trang giới thiệu công khai được tạo từ manifest đã ký. Hoàn thiện các trường sau trước khi đóng gói:

1. `id` dạng reverse-DNS, tên hiển thị `name`, phiên bản semantic trong `version`, `description` và `author`.
2. Khoảng phiên bản Z-CMS tương thích trong `engine`.
3. `entry` đã được build, thông thường là `dist/index.js`.
4. `permissions`, khả năng và thiết lập của plugin; hoặc template và thiết lập của theme.
5. Tối đa ba ảnh chụp màn hình trong `media.screenshots`; chỉ nhận PNG, JPEG hoặc WebP, tối đa 2 MB và 4096 px mỗi chiều.
6. Video giới thiệu trong `media.video`, không bắt buộc. Nên tải video lên YouTube, đặt **Visibility** thành **Public**, rồi dùng URL HTTPS của trang xem video.

Để thêm video vào manifest:

1. Upload video demo plugin hoặc theme lên YouTube.
2. Trong **YouTube Studio → Content**, mở video và đặt **Visibility** thành **Public**.
3. Mở trang xem video, chọn **Share → Copy**. Nên dùng URL đầy đủ có dạng `https://www.youtube.com/watch?v=VIDEO_ID`.
4. Dán URL vào `media.video`:

   ```json
   {
     "media": {
       "screenshots": ["screenshots/admin.png"],
       "video": "https://www.youtube.com/watch?v=VIDEO_ID"
     }
   }
   ```

Marketplace và người kiểm duyệt phải mở được video mà không cần đăng nhập hoặc yêu cầu quyền truy cập. Không dùng URL của YouTube Studio, URL chỉnh sửa video hoặc video ở trạng thái **Private**. Trước khi đóng gói, hãy mở URL trong cửa sổ ẩn danh để xác nhận video phát được.

Nếu phiên bản mới bổ sung permission hoặc thay đổi cách xử lý dữ liệu, hãy nêu rõ thay đổi. Không giấu việc tăng permission trong một mục lịch sử thay đổi chung chung.

## Bước 3: Đóng gói và ký file phát hành

Build từ một bản checkout sạch, dùng lockfile đã commit và đúng phiên bản bộ công cụ được ghi trong tài liệu của project. Sau đó chạy kiểm tra kiểu dữ liệu, lint và unit test, rồi xác nhận entry đã build là chính xác. Bạn không tự sửa version bằng tay — `zcms pack` sẽ đóng dấu và tăng version giúp bạn (xem **`pack` tự đặt version** bên dưới).

### Trỏ `pack` tới đúng theme hoặc plugin cần phát hành

`zcms pack` chỉ đóng gói **đúng một thư mục**, và thư mục đó chính là tham số đầu tiên — đường dẫn tới theme hoặc plugin bạn muốn phát hành. Không có gì nằm ngoài đường dẫn đó được đưa vào, nên đây là nơi bạn chỉ rõ *sẽ đóng gói extension nào*. Ở thư mục gốc phải có:

- manifest — `theme.json` cho theme, `plugin.json` cho plugin — và
- file entry đã build mà manifest khai báo trong `entry`: `dist/index.mjs` cho theme, `dist/index.js` cho plugin. Hãy build trước khi đóng gói; `pack` không tự build giúp bạn.

`--kind` phải khớp với manifest tại đường dẫn đó: `--kind theme` cho `theme.json`, `--kind plugin` cho `plugin.json`.

**Để đóng gói một theme**, trỏ đường dẫn tới thư mục của theme:

```bash
mkdir -p release

zcms pack ./themes/corporate --kind theme \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/corporate-1.0.0.zcms
```

**Để đóng gói một plugin**, trỏ đường dẫn tới thư mục của plugin:

```bash
zcms pack ./plugins/seo-toolkit --kind plugin \
  --key ./keys/publisher-private.pem \
  --pub ./keys/publisher-public.pem \
  --out ./release/seo-toolkit-1.0.0.zcms
```

Đường dẫn có thể là tuyệt đối (`/home/me/themes/corporate`) hoặc tương đối (`./themes/corporate`, hoặc `.` khi shell của bạn đang ở trong thư mục đó) — chỉ cần trỏ đúng tới thư mục chứa manifest. Mỗi lệnh chỉ nhận một đường dẫn: muốn phát hành nhiều extension thì chạy `zcms pack` một lần cho mỗi cái. Nếu bỏ qua `--out`, file sẽ được ghi vào thư mục hiện tại với tên `<manifest.id>-<manifest.version>.zcms`.

### `pack` tự đặt version

Bạn không tự sửa version bằng tay trước khi phát hành. `zcms pack` đóng gói đúng version mà manifest đang khai báo, rồi tăng version đó lên — mặc định là patch — và ghi số mới trở lại manifest và `package.json`, để bản phát hành tiếp theo đã là một version mới. Truyền `--bump minor|major` để tăng bước lớn hơn, `--set-version <semver>` để cố định một version chính xác, hoặc `--no-bump` để giữ nguyên. Tên file `<manifest.id>-<manifest.version>.zcms` dùng version đã được đóng gói; nếu pack thất bại, version được rollback.

### Việc ký diễn ra ngay trong `pack`

Đóng gói **chính là bước ký** — không có lệnh `zcms sign` riêng. `--key` là khóa **riêng** của nhà phát hành, và `zcms pack` dùng nó để ký lên checksum nội dung của package khi ghi file; `--pub` nhúng khóa **công khai** tương ứng để người xác minh kiểm tra được chữ ký đó. Cả hai đều lấy từ Bước 1. Đừng để khóa riêng trên máy dùng chung hay trong log CI; trình đóng gói không bao giờ đưa file `*.pem` vào archive, nhưng nó không cứu được một khóa đã bị bạn dán ra ngoài.

Lệnh sẽ in ra ID package, phiên bản, dung lượng file và checksum. Hãy lưu checksum — đó là giá trị mà cả trình xác minh lẫn Marketplace đều tính lại.

### Xác minh, rồi kiểm tra khả năng tái tạo

Xác minh chữ ký nhà phát hành trên đúng file bạn sẽ gửi:

```bash
zcms verify ./release/corporate-1.0.0.zcms
```

Sau đó đóng gói cùng thư mục thêm một lần nữa để xác nhận bản build có thể tái tạo. Vì `pack` tăng version sau mỗi lần chạy, hãy thêm `--no-bump` vào cả hai lần pack để giữ version cố định giữa chúng; CLI sắp xếp các tệp và đặt timestamp của archive về 0 nên checksum phải giống lần đầu. Nếu hai checksum khác nhau, hãy loại bỏ dữ liệu đầu vào không ổn định như timestamp, thứ tự tệp thay đổi hoặc dependency chưa được cố định phiên bản trước khi gửi.

## Bước 4: Gửi kiểm duyệt

Hãy gửi **đúng file `.zcms` bạn đã xác minh** ở Bước 3 — không build lại hay đóng gói lại trong khoảng giữa lúc xác minh và lúc tải lên.

Mở [**Developer Portal → Submit a package**](https://marketplace.z-cms.org/developer/submit), chọn file `.zcms` rồi nhấn **Submit for review**. Mỗi file được phép có dung lượng tối đa 20 MB; mỗi tài khoản developer được gửi tối đa 10 package trong khoảng thời gian một giờ liên tiếp.

Portal không yêu cầu chọn nhà phát hành, ID package hoặc phiên bản. Các giá trị này được đọc từ phần thông tin đã ký trong package; nhà phát hành được xác định bằng khóa công khai đã đăng ký — nghĩa là danh tính của thứ bạn gửi đến hoàn toàn từ package đã ký, không phải từ một biểu mẫu.

Nếu tải lên qua API, gửi request `multipart/form-data` đã xác thực tới `POST /developer/submissions` và đặt file trong trường `file`. Dùng `GET /developer/submissions` để xem các lượt gửi của tài khoản hiện tại và trạng thái của chúng.

Sau khi gửi, phiên bản sẽ đi qua các trạng thái mô tả ở những bước sau: tiếp nhận tự động trước (Bước 5), rồi tới quyết định của người kiểm duyệt (Bước 6). Theo dõi trạng thái tại **Developer Portal → Submissions**; package bị từ chối luôn kèm lý do để bạn xử lý.

## Bước 5: Xác minh tự động

Marketplace tiếp nhận package theo đúng thứ tự:

1. Mở archive nhưng không chạy code và tính lại checksum của nội dung.
2. Tìm nhà phát hành từ khóa công khai đã đăng ký và xác nhận tài khoản developer sở hữu nhà phát hành đó.
3. Xác minh chữ ký nhà phát hành bằng khóa đã đăng ký, không chỉ tin khóa nằm trong package.
4. Xác minh media và chạy trình quét tĩnh.
5. Thêm chữ ký của Marketplace rồi lưu package đã được chấp nhận.

Nếu trình quét trả về `reject`, Marketplace báo lỗi và không tạo phiên bản. Kết quả `flag` tạo phiên bản ở trạng thái `QUARANTINED` kèm phát hiện cần xem xét. Kết quả sạch tạo phiên bản `PENDING`; trạng thái này chưa có nghĩa là đã được phê duyệt.

## Bước 6: Kiểm duyệt thủ công

Mọi phiên bản của bên thứ ba ở trạng thái `PENDING` hoặc `QUARANTINED` đều phải được nhân viên kiểm duyệt. Các trạng thái gồm `PENDING`, `QUARANTINED`, `APPROVED` và `REJECTED`. Developer Portal và thông báo sẽ hiển thị kết quả; package bị từ chối luôn đi kèm lý do.

Khi người kiểm duyệt yêu cầu thay đổi:

1. Đọc lý do từ chối và phát hiện của trình quét.
2. Cập nhật source, test và manifest.
3. Build, ký và xác minh file `.zcms` mới — `zcms pack` tự đóng dấu version tiếp theo (manifest đã tự tăng sau lần pack trước của bạn).
4. Gửi phiên bản mới.

Mỗi phiên bản là bất biến. Nếu tải lên nội dung khác dưới một phiên bản đã tồn tại, package sẽ bị từ chối; nếu tải lại đúng nội dung cũ, kết quả kiểm duyệt trước đó được giữ nguyên.

## Bước 7: Marketplace ký package

`zcms pack` tạo chữ ký của nhà phát hành. Sau khi xác minh nhà phát hành và quét package, Marketplace thêm chữ ký thứ hai trên cùng checksum rồi lưu file `.zcms` có đủ hai chữ ký.

Chữ ký của Marketplace không tự động công khai package đang chờ duyệt. Registry chỉ cung cấp phiên bản `APPROVED` và chưa bị thu hồi. Trước khi cài, Z-CMS runtime xác minh chữ ký này bằng `MARKETPLACE_PUBLIC_KEY` đã được cấu hình cố định.

## Bước 8: Publish và kiểm tra

Khi người kiểm duyệt phê duyệt, phiên bản tự động xuất hiện trong registry công khai. Sau đó:

1. Mở trang giới thiệu công khai và kiểm tra metadata, ảnh chụp màn hình và lịch sử thay đổi.
2. Cài package từ Marketplace lên một website kiểm thử sạch.
3. Xác nhận quá trình xác minh chữ ký thành công.
4. Kích hoạt package với đúng các permission đã ghi trong tài liệu.
5. Chạy kiểm thử nhanh và kiểm tra khả năng gỡ cài đặt hoặc rollback.

Nếu đã tải file `.zcms` từ Marketplace và muốn tự kiểm tra chữ ký trước khi cài đặt, hãy chạy lệnh sau trên máy của bạn. Tham số `--marketplace-key` phải trỏ đến file public key chính thức của Marketplace:

```bash
zcms verify ./downloaded-package.zcms --marketplace-key ./marketplace-public.pem
```

## Bước 9: Duy trì bản phát hành

Theo dõi kênh hỗ trợ và địa chỉ liên hệ bảo mật. Mọi bản sửa lỗi phải được phát hành bằng semantic version mới; không sửa nội dung của bản phát hành đã có.

Khi có sự cố bảo mật, hãy phối hợp công bố thông tin, gửi package đã sửa và yêu cầu thu hồi phiên bản bị ảnh hưởng nếu cần. Runtime sẽ đồng bộ danh sách thu hồi đã ký và cách ly package đã bị thu hồi.

:::note[Nội dung demo của theme không tự động cập nhật]
Nếu theme của bạn có kèm nội dung demo, việc cập nhật theme sẽ **không** làm mới dữ liệu demo của website. Khi một phiên bản mới thay đổi dữ liệu demo đó — sửa bản dịch, thêm trang hoặc menu — mỗi website vẫn giữ nguyên nội dung demo hiện có cho tới khi admin của website đó mở **Admin → Appearance** và nhấn **Reseed demo** cho theme đang kích hoạt (bản cài mới cần nhấn **Seed demo** trước). Reseed chỉ thay thế các bản ghi demo của chính theme đó và không đụng tới nội dung thật của admin. Hãy nêu rõ trong lịch sử thay đổi để người vận hành biết cần reseed. Xem [Cung cấp nội dung demo](/vi/developers/theme-handbook/demo-content/#hiểu-hành-vi-reseed).
:::
