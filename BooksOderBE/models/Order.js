const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  // Danh sách các sách đã mua trong đơn này
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true } // Lưu lại giá tại thời điểm mua
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'Chờ xác nhận',
    enum: ['Chờ xác nhận', 'Đang vận chuyển', 'Hoàn thành', 'Đã hủy', 'Đang xử lý', 'Đang giao', 'Đã giao']
  },
  address: { type: String, required: true } // Địa chỉ giao hàng
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);