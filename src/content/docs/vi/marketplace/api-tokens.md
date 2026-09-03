---
title: Token API
description: Tạo và sử dụng token API để gửi gói lên Developer Portal từ trình chỉnh sửa theme, tập lệnh hoặc CI.
sidebar:
  order: 3
---

**Token API** là thông tin xác thực để chương trình gửi gói lên Marketplace thay bạn mà không cần phiên đăng nhập trình duyệt. Token được dùng trong hai trường hợp:

- **Trình chỉnh sửa theme của Z-CMS:** ký và gửi theme được tạo trong trang quản trị qua chức năng **Kết nối tài khoản marketplace**.
- **Tập lệnh hoặc CI của bạn:** gọi trực tiếp API gửi gói.

Token chỉ có phạm vi `submissions:write`, dùng để gửi gói kiểm duyệt và theo dõi các lượt gửi qua API bên dưới. Nó không cho phép ký gói, tạo token khác, đăng ký hoặc thay khóa nhà phát hành, hay truy cập dữ liệu riêng tư ngoài phạm vi này. Việc ký vẫn dùng khóa riêng của nhà phát hành trên máy hoặc trong trình duyệt; token chỉ xác thực thao tác tải gói đã ký lên Marketplace.

## Tạo token

Mở **Developer Portal → Tokens** và tạo một token:

1. **Nhãn (Label):** tên chỉ bạn thấy, dùng để phân biệt các token, ví dụ `laptop của tôi` hoặc `acme CI`.
2. **Hạn dùng (Expiry):** chọn không hết hạn hoặc 30, 90, 365 ngày. Với token dùng lâu dài, nên đặt hạn để chủ động thay mới. Portal tự từ chối token đã hết hạn.

Chọn **Tạo**. Token đầy đủ, có dạng `zcms_pat_…`, chỉ xuất hiện một lần. Hãy sao chép và lưu vào nơi bảo mật ngay. Portal chỉ lưu giá trị băm nên không thể hiển thị lại token. Nếu làm mất, hãy thu hồi và tạo token mới.

## Dùng token

### Từ trang quản trị Z-CMS

Trong bảng **Phát hành** của trình chỉnh sửa theme, mở **Kết nối tài khoản marketplace**, dán token rồi chọn **Kết nối**. Z-CMS lưu token ở dạng mã hóa và không hiển thị lại. Từ đó, **Ký & gửi duyệt** dùng token này để tải gói đã ký lên.

### Từ tập lệnh hoặc CI

Gửi token trong thông tin xác thực Bearer khi gọi API tải gói lên:

```bash
curl -X POST https://marketplace.z-cms.org/api/v1/developer/submissions \
  -H "Authorization: Bearer zcms_pat_…" \
  -F "file=@corporate-1.2.0.zcms"
```

Liệt kê và theo dõi các lần gửi cũng bằng token đó:

```bash
curl https://marketplace.z-cms.org/api/v1/developer/submissions \
  -H "Authorization: Bearer zcms_pat_…"
```

Mỗi gói tối đa 20 MB; mỗi tài khoản lập trình viên được gửi tối đa 10 gói trong bất kỳ khoảng thời gian một giờ nào. Portal đọc ID, phiên bản và nhà phát hành từ phần thông tin có chữ ký trong gói. Token chỉ xác định tài khoản đang tải lên.

## Quản lý và thu hồi

Danh sách hiển thị nhãn, phần đầu token để nhận diện (`zcms_pat_` cùng vài ký tự, không đủ để xác thực), thời điểm tạo, lần dùng gần nhất và hạn dùng.

Chọn **Thu hồi (Revoke)** để vô hiệu hóa token ngay. Mọi yêu cầu tiếp theo dùng token đó sẽ bị từ chối. Hãy thu hồi khi nghi ngờ bị lộ, khi ngừng sử dụng một thiết bị hoặc khi thay thông tin xác thực của CI.

## Giữ token an toàn

- **Dùng token riêng cho từng nơi:** một token cho máy cá nhân, một token cho mỗi hệ thống CI. Thu hồi một token sẽ không ảnh hưởng nơi khác.
- **Đặt hạn dùng:** chủ động thay mới các token dùng lâu dài, không để thông tin xác thực có hiệu lực vô thời hạn nếu không cần thiết.
- **Không đưa token vào Git hoặc trang công khai.** Tiền tố `zcms_pat_` giúp công cụ quét phát hiện token bị lộ, nhưng bạn vẫn phải thu hồi ngay khi phát hiện sự cố.
- **Bảo vệ bản token đầy đủ của bạn.** Portal chỉ lưu giá trị băm; bản gốc trong máy, CI hoặc kho bí mật vẫn cần được bảo vệ như mật khẩu.

## Liên quan

- [Phát hành gói cài đặt](/vi/marketplace/publishing/) — quy trình tạo khóa, đóng gói, ký và gửi kiểm duyệt.
- [Tổng quan Marketplace](/vi/marketplace/overview/) — cơ chế kiểm duyệt và phân phối.
