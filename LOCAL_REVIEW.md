# Kiểm tra bản cục bộ

Code được phát triển từ `origin/update/function`, commit gốc `683d70c`. Bản cập nhật bổ sung chức năng mua sách và quản lý thanh toán; xem lịch sử Git để xác định commit hiện tại.

## Chạy ứng dụng

Yêu cầu Node.js 24, hai terminal mở tại thư mục `assslot2`.

Terminal 1:

```powershell
cd BooksOderBE
npm install
npm run preview
```

Terminal 2:

```powershell
cd BooksOder
npm ci
npm run web -- --host localhost --port 8081
```

Mở http://localhost:8081. Backend chạy ở http://localhost:3000.

`npm run preview` dùng MongoDB cục bộ riêng, không kết nối MongoDB Atlas trong `.env` của team. Lần đầu cần Internet để tải MongoDB. Dữ liệu nằm trong `.local-data/`, được bỏ qua bởi Git. Tài khoản mẫu chỉ được tạo nếu chưa tồn tại, không ghi đè mật khẩu sau mỗi lần chạy.

| Vai trò | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Admin | admin | admin123 |
| User | user1 | user123 |
| User khác | user2 | user123 |

## Luồng kiểm tra

1. Đăng ký tài khoản mới; thử mật khẩu dưới 6 ký tự, đăng ký trùng và đăng nhập sai. Đăng ký công khai luôn tạo user.
2. Đăng nhập user1: tìm tên sách/tác giả, lọc thể loại, sắp xếp giá, mở chi tiết, đánh giá sách, thêm/bỏ yêu thích.
3. Thêm giỏ hàng, thay đổi số lượng, xóa sách. Thử số lượng vượt tồn kho.
4. Thanh toán: tên người nhận, số điện thoại, địa chỉ, ghi chú; chọn COD hoặc chuyển khoản. Tổng và giá do API tính lại; giao hàng 25.000 đ, miễn phí từ 300.000 đ.
5. Xem chi tiết/lịch sử đơn; hủy đơn chờ xác nhận. Kho được hoàn trả một lần.
6. Đăng nhập user2: giỏ hàng, yêu thích và đơn hàng phải tách biệt.
7. Đăng nhập admin: thêm/sửa/xóa sách; xem các đơn, thông tin người nhận và trạng thái thanh toán.
8. Với COD: duyệt giao → xác nhận đã thu tiền → hoàn thành. Với chuyển khoản: xác nhận đã thu tiền → duyệt giao → hoàn thành.
9. Hủy đơn đã thu tiền: chuyển sang chờ hoàn tiền; admin xác nhận đã hoàn tiền. Không khôi phục đơn đã hủy hoặc sửa đơn đã hoàn thành.
10. Kiểm tra dashboard sau khi quay lại tab: doanh thu chỉ tính đơn hoàn thành đã thanh toán. Sách đã xóa vẫn còn thông tin trong lịch sử đơn.

Thanh toán chuyển khoản đang là luồng kiểm thử/xác nhận thủ công, không có cổng thanh toán hoặc giao dịch tiền thật. Chưa cấu hình tài khoản ngân hàng hay khóa thanh toán của cửa hàng.

## Kiểm tra mã nguồn

```powershell
cd BooksOderBE
npm test
cd ../BooksOder
npm run lint
npm run typecheck
npm run build:web
```

API integration tests chạy MongoDB tạm riêng, không dùng dữ liệu preview hoặc cloud. Các bài kiểm tra bao gồm phân quyền, quyền sở hữu, giá/tồn kho, checkout lặp, hai người mua cuốn cuối, thanh toán, hoàn tiền và lịch sử sau khi xóa sách.

## Kết nối cơ sở dữ liệu của team sau khi duyệt

`npm start` vẫn dùng `MONGODB_URI` trong `.env`; cần bổ sung `JWT_SECRET` riêng theo `.env.example`. MongoDB phải hỗ trợ transaction (Atlas hoặc replica set). Không dùng tài khoản/secret của bản preview cho môi trường thật.

## Đối chiếu đề bài

Link `Assignment - Handbag.pdf` trên LMS yêu cầu phiên đăng nhập. Chưa đọc được toàn bộ yêu cầu để xác nhận đủ mọi tiêu chí chấm. Cần bản PDF đính kèm để hoàn tất bảng đối chiếu; các chức năng ở trên được thực hiện theo yêu cầu mua sách trong chat.

## Giới hạn kiểm tra giao diện

Đã kiểm tra build và API. Kiểm tra tương tác bằng trình duyệt tự động chưa hoàn tất do công cụ điều khiển trình duyệt dừng tại trình đọc PDF. Cần kiểm tra trực quan và các bước phía trên trên trình duyệt trước khi duyệt.
