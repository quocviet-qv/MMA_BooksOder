const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  checkoutKey: { type: String },
  recipientName: { type: String, default: '' },
  phone: { type: String, default: '' },
  note: { type: String, default: '' },
  subtotal: { type: Number, min: 0 },
  shippingFee: { type: Number, min: 0, default: 0 },
  voucherCode: { type: String, default: '' },
  discountAmount: { type: Number, min: 0, default: 0 },
  paymentMethod: { type: String, enum: ['COD', 'BANK_TRANSFER'], default: 'COD' },
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'refund_pending', 'refunded'], default: 'unpaid' },
  paidAt: Date,
  // Danh sách các sách đã mua trong đơn này
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    bookName: String,
    author: String,
    coverImage: String
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'Chờ xác nhận',
    enum: ['Chờ xác nhận', 'Đang vận chuyển', 'Hoàn thành', 'Đã hủy', 'Đang xử lý', 'Đang giao', 'Đã giao']
  },
  isRevenueAdded: { type: Boolean, default: false },
  address: { type: String, required: true } // Địa chỉ giao hàng
}, { timestamps: true });

orderSchema.index({ userId: 1, checkoutKey: 1 }, { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } });
module.exports = mongoose.model('Order', orderSchema);
