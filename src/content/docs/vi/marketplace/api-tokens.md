---
title: API Token
description: Tạo và dùng API token của Developer Portal để gửi package mà không cần đăng nhập trình duyệt.
sidebar:
  order: 3
---

**API token** là một credential dành cho máy, cho phép một chương trình gửi package lên Marketplace thay bạn — không cần đăng nhập bằng trình duyệt. Hai nơi dùng nó:

- **Trình chỉnh sửa theme của Z-CMS**, khi bạn ký và gửi một theme vẽ tay ngay trong admin ("Kết nối tài khoản marketplace").
- **Script hoặc CI của riêng bạn**, gọi thẳng API gửi package.

Token chỉ làm được đúng một việc — gửi package để duyệt. Nó **không** ký được package, không tạo được token khác, không đăng ký hay xoay publisher key, và không đọc được bất cứ dữ liệu riêng tư nào. Phạm vi duy nhất của nó là `submissions:write`. Việc ký vẫn dùng publisher key của bạn — thứ không bao giờ rời khỏi máy hay trình duyệt; token chỉ mang gói **đã ký** lên Marketplace.

## Tạo token

Mở **Developer Portal → Tokens** và tạo một token:

1. **Nhãn (Label)** — tên chỉ mình bạn thấy, để sau này phân biệt các token: `laptop của tôi`, `acme CI`.
2. **Hạn dùng (Expiry)** — `Không bao giờ`, hoặc 30 / 90 / 365 ngày. Một token nằm trong kho bí mật hàng tháng trời nên có ngày kết thúc; Portal tự động từ chối nó sau ngày đó.

Bấm **Tạo**. Token đầy đủ — dạng `zcms_pat_…` — chỉ hiện **một lần** ngay lúc đó. Hãy copy ngay: nó chỉ được lưu ở dạng hash và **không thể lấy lại**. Nếu làm mất, hãy thu hồi và tạo token khác.

## Dùng token

### Từ admin Z-CMS

Trong panel **Phát hành** của trình chỉnh sửa theme, mở **Kết nối tài khoản marketplace**, dán token vào rồi bấm **Kết nối**. Token được lưu mã hoá và không hiện lại lần nào nữa. Từ đó, **Ký & gửi duyệt** sẽ tải gói đã ký lên bằng token này.

### Từ script hoặc CI

Gửi token dưới dạng bearer credential ở endpoint gửi package:

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

Giới hạn tải lên là 20 MB, và mỗi tài khoản developer gửi tối đa 10 package trong một giờ trượt. Portal đọc id, version và publisher **từ envelope đã ký** — token chỉ chứng minh ai là người tải lên.

## Quản lý và thu hồi

Danh sách token hiển thị: nhãn, phần prefix nhìn thấy được (`zcms_pat_` cộng vài ký tự — đủ để nhận ra, không đủ để xác thực), thời điểm tạo, lần dùng gần nhất, và hạn dùng.

**Thu hồi (Revoke)** là công tắc ngắt: request kế tiếp dùng token đã thu hồi sẽ thất bại ngay. Hãy thu hồi ngay khi nghi token bị lộ, khi một máy ngừng sử dụng, hoặc khi xoay secret của CI.

## Giữ token an toàn

- **Mỗi nơi một token** — một token cho laptop, token riêng cho từng hệ thống CI. Thu hồi một cái sẽ không ảnh hưởng các cái còn lại.
- **Đặt hạn dùng** cho các token sống lâu; gia hạn có chủ đích thay vì để một credential có hiệu lực mãi mãi.
- **Không bao giờ commit token** hay dán vào trang công khai. Prefix `zcms_pat_` là cố ý: nó giúp secret scanner phát hiện token bị lộ nhanh — nhưng bạn tự thu hồi còn nhanh hơn.
- Token được lưu ở dạng **hash**, nên nếu cơ sở dữ liệu phía chúng tôi bị lộ cũng không cho ra credential dùng được. Hãy giữ bản copy của bạn cẩn thận như vậy.

## Liên quan

- [Phát hành package](/vi/marketplace/publishing/) — quy trình đầy đủ keygen → pack → ký → gửi.
- [Tổng quan Marketplace](/vi/marketplace/overview/) — cách duyệt và phân phối hoạt động.
