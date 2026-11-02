const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fail = (status, message) => Object.assign(new Error(message), { status });
const normalize = s => ({
  'Chờ xác nhận': 'Pending',
  'Đang xử lý': 'Pending',
  'Đang vận chuyển': 'Shipping',
  'Đang giao': 'Shipping',
  'Đã giao': 'Delivered',
  'Hoàn thành': 'Completed',
  'Đã hủy': 'Cancelled',
}[s] || s);
const STORE_VOUCHERS = [
  {
    code: 'GIAM10',
    name: 'Giảm 10% đơn hàng',
    description: 'Giảm 10% tối đa 50.000đ cho mọi đơn',
    type: 'percent',
    value: 10,
    minOrder: 0,
    maxDiscount: 50000,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển',
    description: 'Hỗ trợ 25.000đ phí giao hàng',
    type: 'shipping',
    value: 25000,
    minOrder: 0,
  },
  {
    code: 'BOOKWORM20',
    name: 'Mọt sách - Giảm 20K',
    description: 'Giảm 20.000đ cho đơn từ 100.000đ',
    type: 'fixed',
    value: 20000,
    minOrder: 100000,
  },
  {
    code: 'VIP50',
    name: 'Khách VIP - Giảm 50K',
    description: 'Giảm 50.000đ cho đơn từ 250.000đ',
    type: 'fixed',
    value: 50000,
    minOrder: 250000,
  },
];

function calculateDiscount(subtotal, shippingFee, voucherCode) {
  if (!voucherCode) return { discountAmount: 0, appliedVoucher: null };
  const cleanCode = String(voucherCode).trim().toUpperCase();
  const v = STORE_VOUCHERS.find(item => item.code.toUpperCase() === cleanCode);
  if (!v) return { discountAmount: 0, appliedVoucher: null };
  if (subtotal < (v.minOrder || 0)) return { discountAmount: 0, appliedVoucher: null };

  let discount = 0;
  if (v.type === 'percent') {
    discount = Math.round(subtotal * (v.value / 100));
    if (v.maxDiscount) discount = Math.min(discount, v.maxDiscount);
  } else if (v.type === 'shipping') {
    discount = Math.min(shippingFee, v.value);
  } else if (v.type === 'fixed') {
    discount = v.value;
  }
  discount = Math.min(discount, subtotal + shippingFee);
  return { discountAmount: discount, appliedVoucher: v };
}

function totals(items, voucherCode = '') {
  const subtotal = items.reduce((sum, item) => sum + item.bookId.price * item.quantity, 0);
  const shippingFee = subtotal >= 300000 || !items.length ? 0 : 25000;
  const { discountAmount, appliedVoucher } = calculateDiscount(subtotal, shippingFee, voucherCode);
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);
  return {
    subtotal,
    shippingFee,
    voucherCode: appliedVoucher ? appliedVoucher.code : '',
    discountAmount,
    totalAmount,
  };
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
async function addRevenueToAdmin(order, session) {
  const admin = await User.findOneAndUpdate(
    { role: 'admin' },
    { $inc: { walletBalance: order.totalAmount } },
    { returnDocument: 'after', session }
  );
  if (!admin) throw fail(500, 'Không tìm thấy tài khoản Admin để cộng doanh thu');
  order.isRevenueAdded = true;
}
async function notifyAdmins(title, message, orderId, session) {
  const admins = await User.find({ role: 'admin' }).select('_id').session(session);
  if (!admins.length) throw fail(500, 'Không tìm thấy tài khoản Admin để nhận thông báo');
  await Notification.create(
    admins.map(admin => ({ userId: admin._id, title, message, orderId })),
    { session }
  );
}
exports.getCheckoutSummary = async (req, res) => {
  const items = (await Cart.find({ userId: req.user.id }).populate('bookId')).filter(i => i.bookId);
  const voucherCode = req.query.voucherCode || '';
  res.json({
    items,
    ...totals(items, voucherCode),
    availableVouchers: STORE_VOUCHERS,
  });
};
exports.checkout = async (req, res) => {
  const { recipientName, phone, address, note = '', paymentMethod = 'COD', checkoutKey, voucherCode = '' } = req.body;
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
      const orderTotals = totals(cart, voucherCode);
      [result] = await Order.create([{
        userId: req.user.id,
        checkoutKey,
        recipientName: recipientName.trim(),
        phone: phone.replace(/[\s.-]/g, ''),
        address: address.trim(),
        note: note.trim(),
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'unpaid' : 'pending',
        ...orderTotals,
        items: cart.map(i => ({ bookId: i.bookId._id, quantity: i.quantity, price: i.bookId.price, bookName: i.bookId.bookName, author: i.bookId.author, coverImage: i.bookId.coverImage })),
      }], { session });
      await Cart.deleteMany({ _id: { $in: cart.map(i => i._id) } }, { session });
      await Notification.create([{
        userId: req.user.id,
        title: 'Đặt hàng thành công',
        message: 'Đơn hàng của bạn đã được tiếp nhận.',
        orderId: result._id,
      }], { session });
      await notifyAdmins(
        'Có đơn hàng mới',
        `Có đơn hàng mới từ user ${req.user.username}`,
        result._id,
        session
      );
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
    if (userCancellation && current !== 'Pending') throw fail(400, 'Chỉ có thể hủy đơn đang chờ xác nhận');
    if (current === status) {
      if (status === 'Completed' && !order.isRevenueAdded) {
        if (order.paymentStatus !== 'paid') throw fail(400, 'Cần xác nhận đã thu tiền trước khi hoàn thành đơn');
        await addRevenueToAdmin(order, session);
        await order.save({ session });
      }
      result = order;
      return;
    }
    if (!userCancellation && req.user.role !== 'admin' && status !== 'Delivered') {
      throw fail(403, 'Khách hàng chỉ có thể xác nhận đã nhận đơn hàng');
    }
    const allowed = req.user.role === 'admin'
      ? { Pending: ['Shipping', 'Cancelled'], Delivered: ['Completed'] }
      : { Shipping: ['Delivered'], Pending: ['Cancelled'] };
    if (!allowed[current]?.includes(status)) {
      throw fail(400, `Không thể chuyển trạng thái đơn hàng: trạng thái hiện tại "${order.status}", trạng thái yêu cầu "${status}", vai trò "${req.user.role}".`);
    }
    if (status === 'Completed' && order.paymentStatus !== 'paid') throw fail(400, 'Cần xác nhận đã thu tiền trước khi hoàn thành đơn');
    if (status === 'Cancelled') {
      for (const item of order.items) if (item.bookId) await Book.updateOne({ _id: item.bookId }, { $inc: { stock: item.quantity } }, { session });
      if (order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
    }
    if (status === 'Completed' && !order.isRevenueAdded) {
      await addRevenueToAdmin(order, session);
    }
    order.status = status;
    await order.save({ session });
    if (status === 'Shipping') {
      await Notification.create([{
        userId: order.userId,
        title: 'Đơn hàng đang được chuẩn bị và đang giao',
        message: 'Đơn hàng của bạn đã được duyệt và đang được giao.',
        orderId: order._id,
      }], { session });
    } else if (status === 'Delivered') {
      await notifyAdmins(
        'Đơn hàng đã giao đến khách',
        'Khách hàng đã xác nhận nhận được đơn hàng.',
        order._id,
        session
      );
    } else if (status === 'Completed') {
      await Notification.create([{
        userId: order.userId,
        title: 'Đơn hàng đã hoàn thành',
        message: 'Đơn hàng của bạn đã hoàn thành.',
        orderId: order._id,
      }], { session });
      await notifyAdmins(
        'Đơn hàng đã hoàn thành',
        `Đơn hàng #${String(order._id).slice(-6).toUpperCase()} đã hoàn thành.`,
        order._id,
        session
      );
    }
    result = order;
  });
  await result.populate('items.bookId');
  return view(result);
}
exports.cancelOrder = async (req, res) => res.json({ message: 'Đã hủy đơn hàng', order: await changeStatus(req, 'Cancelled', true) });
exports.updateOrderStatus = async (req, res) => {
  const status = normalize(req.body.status);
  if (!['Shipping', 'Delivered', 'Completed'].includes(status)) throw fail(400, 'Trạng thái đơn hàng không hợp lệ');
  res.json({ message: 'Đã cập nhật đơn hàng', order: await changeStatus(req, status) });
};
exports.updatePayment = async (req, res) => {
  let result;
  await mongoose.connection.transaction(async session => {
    const order = await accessibleOrder(req, session);
    const target = req.body.paymentStatus;
    if (target === 'paid' && ['unpaid', 'pending'].includes(order.paymentStatus) && normalize(order.status) === 'Delivered') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
    } else if (target === 'refunded' && order.paymentStatus === 'refund_pending' && normalize(order.status) === 'Cancelled') {
      order.paymentStatus = 'refunded';
    } else throw fail(400, 'Không thể cập nhật thanh toán này');
    await order.save({ session });
    result = order;
  });
  await result.populate('items.bookId');
  res.json({ message: 'Đã cập nhật thanh toán', order: view(result) });
};
exports.getDashboardStats = async (_req, res) => {
  const [orders, books, admin] = await Promise.all([
    Order.find().populate('items.bookId'),
    Book.find(),
    User.findOne({ role: 'admin' }).select('walletBalance'),
  ]);

  const bookMap = new Map(books.map(b => [String(b._id), b]));
  const completed = orders.filter(o => normalize(o.status) === 'Completed');
  const paid = orders.filter(o => o.paymentStatus === 'paid');

  // Ưu tiên đơn hoàn thành, nếu chưa có đơn hoàn thành thì lấy các đơn chưa bị hủy
  const validOrders = completed.length > 0 ? completed : orders.filter(o => normalize(o.status) !== 'Cancelled');

  const sales = {};
  for (const order of validOrders) {
    for (const i of (order.items || [])) {
      const bId = String(i.bookId?._id || i.bookId || i._id);
      const b = bookMap.get(bId) || (i.bookId && typeof i.bookId === 'object' ? i.bookId : null);
      const title = b?.bookName || i.bookName || 'Sách';
      const price = i.price || b?.price || 0;
      const qty = Number(i.quantity) || 1;

      if (!sales[bId]) {
        sales[bId] = {
          _id: bId,
          id: bId,
          title,
          bookName: title,
          coverImage: b?.coverImage || i.coverImage || '',
          price,
          soldCount: 0,
          totalSold: 0,
          revenue: 0,
        };
      }
      sales[bId].soldCount += qty;
      sales[bId].totalSold += qty;
      sales[bId].revenue += price * qty;
    }
  }

  const topSellingBooks = Object.values(sales)
    .sort((a, b) => b.soldCount - a.soldCount || b.revenue - a.revenue)
    .slice(0, 5);

  const pendingCount = orders.filter(o => normalize(o.status) === 'Pending').length;
  const shippingCount = orders.filter(o => normalize(o.status) === 'Shipping').length;
  const deliveredCount = orders.filter(o => normalize(o.status) === 'Delivered').length;
  const completedCount = completed.length;
  const cancelledCount = orders.filter(o => normalize(o.status) === 'Cancelled').length;

  res.json({
    totalRevenue: completed.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
    walletBalance: admin?.walletBalance || 0,
    collectedAmount: paid.reduce((s, o) => s + o.totalAmount, 0),
    totalOrders: orders.length,
    pendingCount,
    pendingOrders: pendingCount,
    shippingCount,
    shippingOrders: shippingCount,
    deliveredCount,
    completedCount,
    completedOrders: completedCount,
    cancelledCount,
    cancelledOrders: cancelledCount,
    totalBooks: books.length,
    totalStock: books.reduce((s, b) => s + (b.stock || 0), 0),
    topSellingBooks,
  });
};

exports.STORE_VOUCHERS = STORE_VOUCHERS;
exports.calculateDiscount = calculateDiscount;
