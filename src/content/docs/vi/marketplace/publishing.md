---
title: Phát hành gói cài đặt
description: Chuẩn bị, ký và gửi gói plugin hoặc theme lên Marketplace để kiểm duyệt và phát hành.
sidebar:
  order: 2
---

Bắt đầu quy trình này sau khi plugin hoặc theme đã vượt qua kiểm thử trên máy của bạn. Chỉ gửi tệp đã xác minh, không biên dịch lại trong quá trình kiểm duyệt.

## Bước 1: Tạo và đăng ký khóa của nhà phát hành

Tạo cặp khóa Ed25519 một lần cho nhà phát hành:

```bash
zcms keygen --out ./keys
```

Lệnh tạo khóa riêng `publisher-private.pem` với quyền truy cập `0600` và khóa công khai `publisher-public.pem`. Sao lưu khóa riêng ở nơi an toàn; không đưa vào Git, tải lên hoặc dán vào biểu mẫu web.

Mở [**Developer Portal → Publisher**](https://marketplace.z-cms.org/developer/publisher) và đăng ký:

1. Mã định danh (slug) dài 3–40 ký tự, chỉ gồm chữ thường, số và dấu gạch ngang; không bắt đầu hoặc kết thúc bằng dấu gạch ngang.
2. Tên hiển thị.
3. Email liên hệ, không bắt buộc.
4. Toàn bộ nội dung của `publisher-public.pem`.

Mỗi khóa công khai chỉ được đăng ký cho một nhà phát hành. Nếu khóa riêng từng bị dán hoặc để lộ, hãy xem khóa đó đã bị xâm phạm và tạo cặp khóa mới.

## Bước 2: Chuẩn bị thông tin giới thiệu

Trang giới thiệu công khai được tạo từ manifest đã ký. Hoàn thiện các trường sau trước khi đóng gói:

1. `id` theo dạng tên miền đảo ngược (reverse-DNS), tên hiển thị `name`, phiên bản theo SemVer trong `version`, mô tả `description` và tác giả `author`.
2. Khoảng phiên bản Z-CMS tương thích trong `engine`.
3. Đường dẫn tệp đã biên dịch trong `entry`: thường là `dist/index.js` cho plugin, `dist/index.mjs` cho theme.
4. Các quyền `permissions`, tính năng và cấu hình của plugin; hoặc mẫu trang và cấu hình của theme.
5. Tối đa ba ảnh trong `media.screenshots`; chỉ nhận PNG, JPEG, WebP, mỗi ảnh tối đa 2 MB và 4096 px mỗi chiều.
6. Video giới thiệu trong `media.video`, không bắt buộc. Nên tải lên YouTube, đặt **Visibility** thành **Public**, rồi dùng URL HTTPS của trang xem video.

Để thêm video vào manifest:

1. Tải video giới thiệu plugin hoặc theme lên YouTube.
2. Trong **YouTube Studio → Content**, mở video và đặt **Visibility** thành **Public**.
3. Mở trang xem video, chọn **Share → Copy**. Nên dùng URL đầy đủ dạng `https://www.youtube.com/watch?v=VIDEO_ID`.
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

Nếu phiên bản mới yêu cầu thêm quyền hoặc thay đổi cách xử lý dữ liệu, hãy nêu rõ. Không gộp việc tăng quyền vào một mô tả thay đổi chung chung.

## Bước 3: Đóng gói và ký tệp phát hành

Biên dịch từ bản mã nguồn sạch, dùng tệp khóa phụ thuộc đã lưu trong Git và đúng phiên bản bộ công cụ của dự án. Chạy kiểm tra kiểu dữ liệu, quy tắc mã nguồn và kiểm thử đơn vị, rồi kiểm tra tệp đầu vào đã biên dịch. Không cần tự tăng phiên bản; `zcms pack` sẽ quản lý việc này như phần dưới mô tả.

### Trỏ `pack` tới đúng theme hoặc plugin cần phát hành

`zcms pack` nhận một đường dẫn thư mục làm tham số đầu tiên và chỉ đóng gói nội dung trong thư mục đó. Hãy trỏ đến đúng plugin hoặc theme cần phát hành. Thư mục phải chứa:

- Manifest ở thư mục gốc: `theme.json` cho theme hoặc `plugin.json` cho plugin.
- Tệp đã biên dịch mà trường `entry` chỉ tới: `dist/index.mjs` cho theme hoặc `dist/index.js` cho plugin. Chạy biên dịch trước vì `pack` không tự làm bước này.

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

Bạn có thể dùng đường dẫn tuyệt đối (`/home/me/themes/corporate`) hoặc tương đối (`./themes/corporate`, hoặc `.` khi đang ở thư mục đó). Mỗi lần chạy chỉ nhận một thư mục; muốn phát hành nhiều tiện ích, chạy `zcms pack` riêng cho từng tiện ích. Nếu không có `--out`, tệp được ghi vào thư mục hiện tại với tên `<manifest.id>-<manifest.version>.zcms`.

### Cách `pack` quản lý phiên bản

`zcms pack` đóng gói phiên bản hiện tại trong manifest rồi tăng phiên bản, mặc định tăng số patch. Giá trị mới được ghi lại vào manifest và `package.json` để chuẩn bị cho lần phát hành sau. Dùng `--bump minor|major` để tăng số minor hoặc major, `--set-version <semver>` để chọn phiên bản đóng gói, hoặc `--no-bump` để không tăng sau khi đóng gói. Tên tệp dùng phiên bản thực tế đã đóng gói. Nếu thao tác thất bại, phiên bản được khôi phục.

### Việc ký diễn ra ngay trong `pack`

`zcms pack` ký ngay khi đóng gói; không có lệnh `zcms sign` riêng. `--key` chỉ tới khóa riêng để ký checksum của nội dung; `--pub` nhúng khóa công khai tương ứng để kiểm tra chữ ký. Dùng cặp khóa đã tạo ở Bước 1. Không để khóa riêng trên máy dùng chung hoặc trong nhật ký CI. CLI loại tệp `*.pem` khỏi gói nén, nhưng không bảo vệ được khóa bạn đã chia sẻ ra ngoài.

Lệnh in ra ID gói, phiên bản, dung lượng tệp và checksum. Hãy lưu checksum để đối chiếu khi xác minh và gửi lên Marketplace.

### Xác minh, rồi kiểm tra khả năng tái tạo

Xác minh chữ ký nhà phát hành trên đúng file bạn sẽ gửi:

```bash
zcms verify ./release/corporate-1.0.0.zcms
```

Đóng gói cùng thư mục hai lần để kiểm tra tính tái lập. Phải dùng `--no-bump` ở cả hai lần, ngay từ lần đầu, để phiên bản không thay đổi. CLI sắp xếp tệp và đặt dấu thời gian trong tệp nén về 0, nên checksum của hai gói cần giống nhau. Nếu khác, hãy tìm dữ liệu đầu vào thay đổi như dấu thời gian, thứ tự tệp hoặc thư viện chưa cố định phiên bản, rồi xử lý trước khi gửi.

## Bước 4: Gửi kiểm duyệt

Gửi đúng tệp `.zcms` đã xác minh ở Bước 3. Không biên dịch hoặc đóng gói lại giữa lúc xác minh và tải lên.

Mở [**Developer Portal → Submit a package**](https://marketplace.z-cms.org/developer/submit), chọn tệp `.zcms` rồi nhấn **Submit for review**. Mỗi tệp tối đa 20 MB; mỗi tài khoản lập trình viên được gửi tối đa 10 gói trong bất kỳ khoảng thời gian một giờ nào.

Portal không yêu cầu nhập nhà phát hành, ID gói hoặc phiên bản. Thông tin này được lấy từ gói đã ký, và nhà phát hành được xác định bằng khóa công khai đã đăng ký. Danh tính gói vì thế không phụ thuộc vào dữ liệu nhập trên biểu mẫu.

Nếu tải qua API, gửi yêu cầu `multipart/form-data` đã xác thực tới `POST /developer/submissions`, với tệp ở trường `file`. Dùng `GET /developer/submissions` để xem lịch sử gửi và trạng thái của tài khoản hiện tại.

Sau khi gửi, gói được xác minh tự động (Bước 5), rồi chuyển tới người kiểm duyệt (Bước 6). Theo dõi tại **Developer Portal → Submissions**. Nếu bị từ chối, kết quả sẽ kèm lý do để bạn xử lý.

## Bước 5: Xác minh tự động

Marketplace tiếp nhận gói theo thứ tự:

1. Mở gói nén nhưng không chạy mã, rồi tính lại checksum của nội dung.
2. Xác định nhà phát hành từ khóa công khai đã đăng ký và kiểm tra tài khoản gửi có sở hữu nhà phát hành đó không.
3. Xác minh chữ ký bằng khóa đã đăng ký, không chỉ tin khóa nhúng trong gói.
4. Kiểm tra hình ảnh, video và chạy trình quét mã tĩnh.
5. Thêm chữ ký Marketplace và lưu gói đã tiếp nhận.

Nếu trình quét trả về `reject`, Marketplace báo lỗi và không tạo phiên bản. Kết quả `flag` tạo phiên bản ở trạng thái `QUARANTINED` kèm phát hiện cần xem xét. Kết quả sạch tạo phiên bản `PENDING`; trạng thái này chưa có nghĩa là đã được phê duyệt.

## Bước 6: Kiểm duyệt thủ công

Mọi phiên bản bên thứ ba ở trạng thái `PENDING` hoặc `QUARANTINED` đều cần người kiểm duyệt xem xét. Bốn trạng thái chính là `PENDING` (Chờ duyệt), `QUARANTINED` (Cách ly), `APPROVED` (Đã phê duyệt) và `REJECTED` (Bị từ chối). Developer Portal và thông báo hiển thị kết quả, kèm lý do nếu bị từ chối.

Khi người kiểm duyệt yêu cầu thay đổi:

1. Đọc lý do từ chối và các vấn đề trình quét phát hiện.
2. Cập nhật mã nguồn, kiểm thử và manifest.
3. Biên dịch, đóng gói, ký và xác minh tệp `.zcms` mới. `zcms pack` dùng phiên bản tiếp theo đã được cập nhật trong manifest sau lần đóng gói trước.
4. Gửi phiên bản mới.

Không thể thay đổi nội dung của phiên bản đã tạo. Tải lên nội dung khác với cùng số phiên bản sẽ bị từ chối; tải lại đúng nội dung cũ sẽ giữ nguyên kết quả kiểm duyệt trước đó.

## Bước 7: Chữ ký của Marketplace

`zcms pack` tạo chữ ký nhà phát hành. Sau khi xác minh và quét gói, Marketplace ký thêm trên cùng checksum, rồi lưu tệp `.zcms` có cả hai chữ ký.

Có chữ ký Marketplace không có nghĩa là gói đã công khai. Kho phân phối chỉ cung cấp phiên bản `APPROVED` và chưa bị thu hồi. Trước khi cài, thành phần thực thi xác minh chữ ký Marketplace bằng `MARKETPLACE_PUBLIC_KEY` đã cấu hình cố định.

## Bước 8: Kiểm tra sau khi công khai

Khi người kiểm duyệt phê duyệt, phiên bản tự động xuất hiện trong registry công khai. Sau đó:

1. Kiểm tra thông tin giới thiệu, ảnh chụp màn hình và lịch sử thay đổi trên trang công khai.
2. Cài gói từ Marketplace lên website kiểm thử sạch.
3. Xác nhận chữ ký được kiểm tra thành công.
4. Kích hoạt với đúng các quyền đã mô tả trong tài liệu.
5. Kiểm thử nhanh các chức năng chính và khả năng gỡ cài đặt hoặc quay lại phiên bản trước.

Nếu muốn tự kiểm tra tệp `.zcms` đã tải từ Marketplace trước khi cài, hãy chạy lệnh sau. `--marketplace-key` phải trỏ đến tệp khóa công khai chính thức của Marketplace:

```bash
zcms verify ./downloaded-package.zcms --marketplace-key ./marketplace-public.pem
```

## Bước 9: Duy trì bản phát hành

Theo dõi kênh hỗ trợ và địa chỉ liên hệ bảo mật. Phát hành mỗi bản sửa lỗi bằng số phiên bản SemVer mới; không sửa nội dung của bản đã phát hành.

Khi có sự cố bảo mật, phối hợp công bố thông tin, gửi gói đã sửa và yêu cầu thu hồi phiên bản bị ảnh hưởng nếu cần. Thành phần thực thi đồng bộ danh sách thu hồi có chữ ký số và cách ly các gói bị thu hồi.

:::note[Dữ liệu mẫu của theme không tự cập nhật]
Cập nhật theme không tự thay đổi dữ liệu mẫu đã tạo trên website. Để nhận các bản dịch, trang hoặc menu mẫu mới, quản trị viên phải mở **Admin → Appearance** và chọn **Reseed demo** cho theme đang hoạt động; lần đầu dùng **Seed demo**. Thao tác này chỉ thay thế bản ghi mẫu của chính theme đó, nhưng cũng làm mất các chỉnh sửa trên những bản ghi ấy. Nội dung không thuộc dữ liệu mẫu được giữ nguyên. Hãy nêu rõ trong lịch sử thay đổi và xem [Cung cấp dữ liệu mẫu](/vi/developers/theme-handbook/demo-content/) trước khi hướng dẫn người dùng tạo lại.
:::
