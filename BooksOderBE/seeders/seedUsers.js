const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const mockUsers = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    description: 'Tài khoản Quản trị viên hệ thống',
  },
  {
    username: 'user1',
    password: 'user123',
    role: 'user',
    description: 'Tài khoản Khách hàng mua sách mẫu 1',
  },
  {
    username: 'user2',
    password: 'user123',
    role: 'user',
    description: 'Tài khoản Khách hàng mua sách mẫu 2',
  },
];

async function seedDefaultUsers() {
  try {
    for (const mock of mockUsers) {
      const existing = await User.findOne({ username: mock.username });
      const hashedPassword = await bcrypt.hash(mock.password, 10);
      if (!existing) {
        await User.create({
          username: mock.username,
          password: hashedPassword,
          role: mock.role,
        });
        console.log(`👤 Đã tạo tài khoản mẫu [${mock.role.toUpperCase()}]: ${mock.username} / ${mock.password}`);
      } else {
        existing.password = hashedPassword;
        existing.role = mock.role;
        await existing.save();
        console.log(`🔄 Đã đồng bộ tài khoản mẫu [${mock.role.toUpperCase()}]: ${mock.username} / ${mock.password}`);
      }
    }
  } catch (error) {
    console.error('Lỗi khi khởi tạo tài khoản mẫu:', error.message);
  }
}

// Nếu chạy trực tiếp: node seeders/seedUsers.js
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Thiếu MONGODB_URI trong .env');
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('✅ Đã kết nối MongoDB. Đang nạp tài khoản mẫu...');
      await seedDefaultUsers();
      console.log('🎉 Hoàn tất nạp dữ liệu mẫu!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Lỗi kết nối MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = seedDefaultUsers;
