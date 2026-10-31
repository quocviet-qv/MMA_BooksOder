const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const seedDefaultUsers = require('./seeders/seedUsers');

const app = express();

// 1. Kết nối Cơ sở dữ liệu MongoDB Atlas & Khởi tạo tài khoản mẫu
connectDB().then(() => {
  seedDefaultUsers();
});

// 2. Global Middlewares
app.use(cors());
// Hỗ trợ nhận ảnh Base64 nén dung lượng cao từ mobile
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// 3. Đăng ký tất cả các Tuyến đường API (Routes)
app.use('/', routes);

// 4. Middlewares xử lý lỗi tập trung
app.use(notFound);
app.use(errorHandler);

// 5. Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API đang chạy tại: http://localhost:${PORT}/books`);
});