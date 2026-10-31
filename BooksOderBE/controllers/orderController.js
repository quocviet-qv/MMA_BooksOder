const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const User = require('../models/User');
const fail = (status, message) => Object.assign(new Error(message), { status });
const pending = ['Chờ xác nhận', 'Đang xử lý'];
const normalize = s => ({ 'Đang xử lý': 'Chờ xác nhận', 'Đang giao': 'Đang vận chuyển', 'Đã giao': 'Hoàn thành' }[s] || s);
function totals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.bookId.price * item.quantity, 0);
  const shippingFee = subtotal >= 300000 || !items.length ? 0 : 25000;
  return { subtotal, shippingFee, totalAmount: subtotal + shippingFee };
}
function view(order) {
  const data = order.toObject ? order.toObject() : order;
  data.items = data.items.map(item => ({ ...item, bookId: item.bookId || { bookName: item.bookName || 'Sách đã ngừng bán', author: item.author, coverImage: item.coverImage } }));
  return data;
}
async function accessibleOrder(req, session) {
  const query = { _id: req.params.id };
  if (req.user.role !== 'admin') query.userId = req.user.id;
  const order = await Order.findOne(query).session(session || null);
  if (!order) throw fail(404, 'Không tìm thấy đơn hàng');
  return order;
}
exports.getCheckoutSummary = async (req, res) => {
  const items = (await Cart.find({ userId: req.user.id }).populate('bookId')).filter(i => i.bookId);
  res.json({ items, ...totals(items) });
};
exports.checkout = async (req, res) => {
  const { recipientName, phone, address, note = '', paymentMethod = 'COD', checkoutKey } = req.body;
  if (typeof recipientName !== 'string' || recipientName.trim().length < 2 || recipientName.length > 100 || typeof address !== 'string' || address.trim().length < 10 || address.length > 500 || typeof phone !== 'string' || !/^(0\d{9}|\+84\d{9})$/.test(phone.replace(/[\s.-]/g, ''))) throw fail(400, 'Nhập họ tên, số điện thoại Việt Nam và địa chỉ nhận hàng đầy đủ');
  if (!['COD', 'BANK_TRANSFER'].includes(paymentMethod) || typeof note !== 'string' || note.length > 1000 || typeof checkoutKey !== 'string' || checkoutKey.length < 12 || checkoutKey.length > 100) throw fail(400, 'Thông tin thanh toán không hợp lệ');
  let result;
  try {
    await mongoose.connection.transaction(async session => {
      const existing = await Order.findOne({ userId: req.user.id, checkoutKey }).session(session);
      if (existing) { result = existing; return; }
      const cart = await Cart.find({ userId: req.user.id }).populate('bookId').session(session);
      if (!cart.length) throw fail(400, 'Giỏ hàng đang trống');
      if (cart.some(i => !i.bookId)) throw fail(400, 'Có sách đã ngừng bán. Vui lòng cập nhật giỏ hàng');
      for (const item of cart) {
        if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw fail(400, 'Số lượng không hợp lệ');
        const reserved = await Book.updateOne({ _id: item.bookId._id, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
        if (!reserved.modifiedCount) throw fail(409, `Sách "${item.bookId.bookName}" không đủ tồn kho`);
      }
      [result] = await Order.create([{
        userId: req.user.id, checkoutKey, recipientName: recipientName.trim(), phone: phone.replace(/[\s.-]/g, ''), address: address.trim(), note: note.trim(), paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'unpaid' : 'pending', ...totals(cart),
        items: cart.map(i => ({ bookId: i.bookId._id, quantity: i.quantity, price: i.bookId.price, bookName: i.bookId.bookName, author: i.bookId.author, coverImage: i.bookId.coverImage })),
      }], { session });
      await Cart.deleteMany({ _id: { $in: cart.map(i => i._id) } }, { session });
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    result = await Order.findOne({ userId: req.user.id, checkoutKey });
    if (!result) throw error;
  }
  res.status(201).json({ message: 'Đặt hàng thành công', order: result });
};
exports.getUserOrders = async (req, res) => res.json((await Order.find({ userId: req.user.id }).populate('items.bookId').sort({ createdAt: -1 })).map(view));
exports.getOrderDetail = async (req, res) => {
  const order = await accessibleOrder(req);
  await order.populate('items.bookId');
  res.json(view(order));
};
exports.getAllOrders = async (_req, res) => {
  const orders = await Order.find().populate('items.bookId').sort({ createdAt: -1 });
  const users = await User.find().select('username');
  const names = Object.fromEntries(users.map(u => [u.id, u.username]));
  res.json(orders.map(o => ({ ...view(o), customerName: names[o.userId] || o.recipientName || 'Khách hàng' })));
};
async function changeStatus(req, status, userCancellation = false) {
  let result;
  await mongoose.connection.transaction(async session => {
    const order = await accessibleOrder(req, session);
    const current = normalize(order.status);
    if (userCancellation && !pending.includes(order.status)) throw fail(400, 'Chỉ có thể hủy đơn đang chờ xác nhận');
    if (current === status) { result = order; return; }
    const allowed = { 'Chờ xác nhận': ['Đang vận chuyển', 'Đã hủy'], 'Đang vận chuyển': ['Hoàn thành', 'Đã hủy'], 'Hoàn thành': [], 'Đã hủy': [] };
    if (!allowed[current]?.includes(status)) throw fail(400, 'Không thể chuyển trạng thái đơn hàng này');
    if (status === 'Hoàn thành' && order.paymentStatus !== 'paid') throw fail(400, 'Cần xác nhận đã thu tiền trước khi hoàn thành đơn');
    if (status === 'Đang vận chuyển' && order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'paid') throw fail(400, 'Cần xác nhận chuyển khoản trước khi giao hàng');
    if (status === 'Đã hủy') {
      for (const item of order.items) if (item.bookId) await Book.updateOne({ _id: item.bookId }, { $inc: { stock: item.quantity } }, { session });
      if (order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
    }
    order.status = status;
    await order.save({ session });
    result = order;
  });
  await result.populate('items.bookId');
  return view(result);
}
exports.cancelOrder = async (req, res) => res.json({ message: 'Đã hủy đơn hàng', order: await changeStatus(req, 'Đã hủy', true) });
exports.updateOrderStatus = async (req, res) => res.json({ message: 'Đã cập nhật đơn hàng', order: await changeStatus(req, req.body.status) });
exports.updatePayment = async (req, res) => {
  let result;
  await mongoose.connection.transaction(async session => {
    const order = await accessibleOrder(req, session);
    const target = req.body.paymentStatus;
    if (target === 'paid' && ['unpaid', 'pending'].includes(order.paymentStatus) && normalize(order.status) !== 'Đã hủy') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    } else if (target === 'refunded' && order.paymentStatus === 'refund_pending' && normalize(order.status) === 'Đã hủy') {
      order.paymentStatus = 'refunded';
    } else throw fail(400, 'Không thể cập nhật thanh toán này');
    await order.save({ session });
    result = order;
  });
  await result.populate('items.bookId');
  res.json({ message: 'Đã cập nhật thanh toán', order: view(result) });
};
exports.getDashboardStats = async (_req, res) => {
  const [orders, books] = await Promise.all([Order.find(), Book.find()]);
  const completed = orders.filter(o => normalize(o.status) === 'Hoàn thành');
  const paid = orders.filter(o => o.paymentStatus === 'paid');
  const sales = {};
  for (const order of completed) for (const i of order.items) {
    const id = String(i.bookId || i._id);
    sales[id] ||= { id, bookName: i.bookName || 'Sách', coverImage: i.coverImage, price: i.price, totalSold: 0 };
    sales[id].totalSold += i.quantity;
  }
  res.json({ totalRevenue: completed.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0), collectedAmount: paid.reduce((s, o) => s + o.totalAmount, 0), totalOrders: orders.length, pendingCount: orders.filter(o => normalize(o.status) === 'Chờ xác nhận').length, shippingCount: orders.filter(o => normalize(o.status) === 'Đang vận chuyển').length, completedCount: completed.length, cancelledCount: orders.filter(o => normalize(o.status) === 'Đã hủy').length, totalBooks: books.length, totalStock: books.reduce((s, b) => s + b.stock, 0), topSellingBooks: Object.values(sales).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5) });
};
