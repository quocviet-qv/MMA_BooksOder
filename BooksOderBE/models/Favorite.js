const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // Tạm dùng String để dễ dàng nhận id, email hoặc số điện thoại từ Frontend
  userId: { type: String, required: true }, 
  // Liên kết chặt chẽ với bảng Book để tự động truy xuất chi tiết sách
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);