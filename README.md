# 📚 MMA_BooksOder - Ứng Dụng Mua Bán Sách Trực Tuyến
 
> Ứng dụng thương mại điện tử chuyên mua bán sách, hỗ trợ đầy đủ luồng nghiệp vụ cho **Khách hàng (User)** và **Quản trị viên (Admin)**.

---

## 📑 Mục Lục
1. [Giới Thiệu Chung](#-giới-thiệu-chung)
2. [Kiến Trúc Dự Án](#-kiến-trúc-dự-án)
3. [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
4. [Tài Khoản Thử Nghiệm Mặc Định](#-tài-khoản-thử-nghiệm-mặc-định)
5. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
6. [Các Tính Năng Nổi Bật](#-các-tính-năng-nổi-bật)
7. [Bảng Màu Thiết Kế](#-bảng-màu-thiết-kế)

---

## 🌟 Giới Thiệu Chung

**MMA_BooksOder** là giải pháp toàn diện cho việc mua sắm sách trên nền tảng di động:
- **Khách hàng**: Khám phá sách hay, xem chi tiết, đọc đánh giá, thả tim yêu thích, quản lý giỏ hàng và đặt hàng trực tuyến.
- **Quản trị viên (Admin)**: Quản lý kho sách (Thêm sách mới `POST`, Sửa thông tin `PUT`, Xóa `DELETE`), duyệt và chuyển trạng thái đơn hàng (`Chờ xác nhận` ➔ `Đang vận chuyển` ➔ `Hoàn thành` / `Đã hủy`), xem thống kê doanh thu.

---

## 📁 Kiến Trúc Dự Án

```
MMA_BooksOder/
├── BooksOder/             # Ứng dụng di động (Frontend React Native / Expo)
│   ├── assets/            # Hình ảnh, icons ứng dụng
│   ├── screens/           # Các màn hình User & Admin (14 màn hình)
│   │   ├── HomeScreen.js           # Trang chủ (Banner carousel, danh mục, sách nổi bật)
│   │   ├── DetailScreen.js         # Chi tiết cuốn sách & viết đánh giá sao
│   │   ├── FavoritesScreen.js      # Danh sách yêu thích (Chế độ xem Grid / List)
│   │   ├── CartScreen.js           # Giỏ hàng & quản lý số lượng
│   │   ├── CheckoutScreen.js       # Xác nhận thông tin đặt hàng
│   │   ├── OrdersScreen.js         # Lịch sử đơn hàng của User
│   │   ├── OrderDetailScreen.js    # Chi tiết đơn hàng & theo dõi trạng thái
│   │   ├── ProfileScreen.js        # Trang cá nhân & chuyển đổi Tiếng Việt / English
│   │   ├── LoginScreen.js          # Màn hình đăng nhập & chọn tài khoản test nhanh
│   │   ├── RegisterScreen.js       # Màn hình đăng ký tài khoản
│   │   ├── AdminDashboardScreen.js # Bảng điều khiển thống kê Admin
│   │   ├── AdminScreen.js          # Quản lý kho sách (Tra cứu & Thao tác CRUD)
│   │   ├── AdminFormScreen.js      # Form Thêm mới (POST) & Chỉnh sửa (PUT) sách
│   │   └── AdminOrdersScreen.js    # Quản lý và duyệt đơn hàng Admin
│   ├── src/
│   │   ├── constants/     # API endpoint tự động nhận IP, màu sắc, theme
│   │   ├── context/       # AuthContext, CartContext, LanguageContext, AlertContext
│   │   └── i18n/          # Từ điển đa ngôn ngữ (Tiếng Việt & English)
│   ├── styles/            # Toàn bộ stylesheet giao diện đồng bộ
│   └── App.js             # Root Navigation (Tab Navigator & Stack Navigator)
│
└── BooksOderBE/           # Máy chủ Backend API (Node.js / Express / MongoDB)
    ├── config/            # Kết nối MongoDB Mongoose Atlas
    ├── controllers/       # Xử lý logic nghiệp vụ Sách, Giỏ hàng, Đơn hàng, User
    ├── models/            # Mongoose Schemas (Book, Order, User, Review, Favorite, Cart)
    ├── routes/            # Khai báo các tuyến đường RESTful API
    ├── seeders/           # Tự động khởi tạo tài khoản mẫu khi start server
    └── server.js          # Entry point server chạy tại cổng 3000
```

---

## 🛠 Công Nghệ Sử Dụng

### 1. Frontend (Mobile App)
- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation (Bottom Tabs Navigator & Native Stack)
- **Icon Set**: `@expo/vector-icons` (Ionicons)
- **Quản lý trạng thái (State Management)**: React Context API:
  - `AuthContext`: Quản lý phiên đăng nhập, vai trò (User/Admin), token lưu tại AsyncStorage.
  - `CartContext`: Huy hiệu đếm số lượng giỏ hàng nhảy realtime trên Tab Bar & Header.
  - `LanguageContext`: Hỗ trợ song ngữ Tiếng Việt & English linh hoạt.
  - `AlertContext`: Hệ thống Popup thông báo hành động cao cấp thay thế alert mặc định.

### 2. Backend (RESTful API)
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB Atlas Cloud thông qua Mongoose ORM
- **Bảo mật**: Mã hóa mật khẩu bằng `bcryptjs`, xác thực bằng JSON Web Token (`jsonwebtoken`)
- **Tương thích**: Hỗ trợ CORS và nén Payload ảnh Base64 lên đến `25MB`

---

## 👤 Tài Khoản Thử Nghiệm Mặc Định

Hệ thống được tích hợp sẵn dữ liệu mẫu (Seeders) tự động khởi tạo ngay khi Backend khởi động:

| Vai trò (Role) | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `admin123` | Quản lý kho sách (POST, PUT, DELETE), duyệt đơn hàng, xem doanh thu |
| **Khách hàng 1 (User)** | `user1` | `user123` | Xem sách, đặt hàng, quản lý giỏ hàng, viết đánh giá |
| **Khách hàng 2 (User)** | `user2` | `user123` | Mua sắm độc lập, lưu yêu thích riêng biệt |

*(Tại màn hình Đăng nhập có sẵn thanh bấm chọn tài khoản test nhanh 1-chạm không cần gõ phím).*

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Khởi chạy Backend (`BooksOderBE`)
Mở cửa sổ Terminal thứ nhất:

```bash
cd BooksOderBE

# Cài đặt thư viện (nếu mới clone)
npm install

# Khởi chạy máy chủ Backend (Cổng mặc định: 3000)
npm start
```

> **Kết quả thành công**: Server hiển thị thông báo `🚀 Backend API đang chạy tại: http://localhost:3000/books` và tự động kết nối MongoDB Atlas.

---

### Bước 2: Khởi chạy Ứng dụng Mobile (`BooksOder`)
Mở cửa sổ Terminal thứ hai:

```bash
cd BooksOder

# Cài đặt thư viện (nếu mới clone)
npm install

# Khởi chạy Expo Dev Server
npx expo start
```

### Bước 3: Mở ứng dụng trên thiết bị
- **Điện thoại thật**: Cài app **Expo Go** (Android/iOS), dùng camera quét mã QR trên terminal. *(Lưu ý: Điện thoại và máy tính cần kết nối cùng một mạng WiFi).*
- **Máy ảo Android**: Nhấn phím `a` trên terminal để mở Android Emulator.
- **Trình duyệt Web**: Nhấn phím `w` trên terminal để mở bản preview trên Web.

---

## ✨ Các Tính Năng Nổi Bật

### 1. Phía Khách hàng (User)
- 📌 **Thanh tìm kiếm Sticky Header**: Cố định trên đầu màn hình khi cuộn trang, tích hợp icon Giỏ hàng (kèm badge realtime) và icon Thông báo.
- 🎠 **Banner Carousel tương tác**: Vuốt qua lại mượt mà, tự động chuyển slide sau mỗi 4.5s (Ưu đãi 15% sách mới, Spotlight sách Top 1 bán chạy nhất, Miễn phí vận chuyển 0đ).
- 🏷 **Bộ lọc sách đa dạng**: Lọc theo thể loại dạng chip (Tiểu thuyết, Kinh tế, Kỹ năng, Công nghệ...) và sắp xếp (Bán chạy, Mới nhất, Giá tăng/giảm).
- 📖 **Chi tiết cuốn sách phong phú**: Đánh giá số sao ngay cạnh tác giả, viết nhận xét kèm chấm điểm tương tác (1-5 sao).
- ❤️ **Màn hình Yêu thích linh hoạt**: Hỗ trợ chuyển đổi chế độ xem Lưới 2 cột hoặc Danh sách ngang, kèm nút "Thêm nhanh vào giỏ" ngay trên thẻ.
- 🛍 **Quy trình Thanh toán tối ưu**: Xem trước giỏ hàng, chọn địa chỉ và thanh toán nhanh chóng.
- 🔔 **Pop-up thông báo hành động cao cấp**: Thay thế hộp thoại xám mặc định bằng Card nổi 3D có icon phát sáng ngữ cảnh (`Thành công`, `Cảnh báo`, `Lỗi`).

### 2. Phía Quản trị viên (Admin)
- 📊 **Thống kê Doanh thu**: Theo dõi tổng doanh số, số đơn hoàn thành và biểu đồ trực quan.
- 📦 **Quản lý Kho sách (CRUD)**:
  - Xem danh sách sách với huy hiệu tồn kho thông minh (*Còn hàng*, *Sắp hết*, *Hết hàng*).
  - **Thêm sách mới (POST)** & **Chỉnh sửa sách (PUT)**: Khung xem trước ảnh bìa thời gian thực (Live Preview) và chip chọn thể loại nhanh 1-chạm.
  - Xóa sách (`DELETE`) kèm hộp thoại xác nhận an toàn.
- 🚚 **Quản lý Đơn hàng (Orders CMS)**:
  - Dãy KPI đếm số đơn theo trạng thái (Chờ duyệt, Đang giao, Hoàn thành, Đã hủy).
  - Thanh tìm kiếm đơn hàng theo mã đơn `#ID`, tên khách, địa chỉ.
  - Duyệt đơn 1-chạm: Chuyển nhanh `Chờ xác nhận` ➔ `Đang vận chuyển` ➔ `Hoàn thành`.
  - Bottom Sheet đổi trạng thái thủ công linh hoạt.

---

## 🎨 Bảng Màu Thiết Kế

Ứng dụng sử dụng bảng màu **Đỏ rượu vang (Burgundy / Crimson Wine)** sang trọng và học thuật:

| Tên màu | Mã Hex | Ứng dụng |
| :--- | :--- | :--- |
| **Primary (Đỏ rượu vang)** | `#B91C1C` | Nút hành động chính, giá tiền, badge giảm giá, viền active |
| **Primary Dark** | `#991B1B` | Trạng thái nhấn giữ nút, điểm nhấn chiều sâu |
| **Primary Light / Tint** | `#FFF1F2` / `#FEE2E2` | Nền nút phụ, huy hiệu thẻ, vòng sáng popup |
| **Slate Dark (Chữ chính)** | `#0F172A` | Tiêu đề, tên sách, văn bản quan trọng |
| **Slate Muted (Chữ phụ)** | `#64748B` | Tác giả, mô tả phụ, ngày tháng |
| **Background (Nền app)** | `#F8F9FA` | Nền toàn bộ ứng dụng dịu mắt |
| **Card Surface (Thẻ)** | `#FFFFFF` | Nền thẻ sách, modal, thanh tìm kiếm |
| **Star Rating (Sao)** | `#F59E0B` | Đánh giá sao vàng kim |
| **Success (Thành công)** | `#059669` | Trạng thái hoàn thành, huy hiệu còn hàng |

---

*Chúc bạn có trải nghiệm tuyệt vời khi phát triển và sử dụng ứng dụng **MMA_BooksOder**!*
