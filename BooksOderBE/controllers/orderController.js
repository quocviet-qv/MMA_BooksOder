const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Thanh toán (Tạo đơn hàng & Dọn sạch giỏ hàng)
// @route   POST /checkout
const checkout = async (req, res) => {
  const { userId, address } = req.body;
  try {
    const cartItems = await Cart.find({ userId }).populate('bookId');
    const validCartItems = cartItems.filter((item) => item.bookId !== null);

    if (validCartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    let totalAmount = 0;
    const orderItems = validCartItems.map((item) => {
      totalAmount += item.bookId.price * item.quantity;
      return {
        bookId: item.bookId._id,
        quantity: item.quantity,
        price: item.bookId.price,
      };
    });

    const newOrder = new Order({
      userId,
      items: orderItems,
      totalAmount,
      address,
      status: 'Chờ xác nhận',
    });
    await newOrder.save();

    // Dọn sạch giỏ hàng của user sau khi đặt thành công
    await Cart.deleteMany({ userId });

    res.status(201).json({ message: 'Đặt hàng thành công', order: newOrder });
  } catch (error) {
    console.error('Lỗi khi xử lý thanh toán:', error);
    res.status(500).json({ error: 'Lỗi khi xử lý thanh toán' });
  }
};

// @desc    Lấy lịch sử đơn hàng của người dùng
// @route   GET /orders/:userId
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('items.bookId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Lỗi lấy lịch sử đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// @desc    Lấy chi tiết một đơn hàng theo ID
// @route   GET /orders/detail/:id
const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.bookId');
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.json(order);
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết đơn hàng' });
  }
};

// @desc    Hủy đơn hàng (khi đơn ở trạng thái Chờ xác nhận / Đang xử lý)
// @route   PUT /orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const cancelableStatuses = ['Chờ xác nhận', 'Đang xử lý'];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Không thể hủy đơn hàng khi đang ở trạng thái "${order.status}".`,
      });
    }

    order.status = 'Đã hủy';
    await order.save();

    res.json({ message: 'Hủy đơn hàng thành công', order });
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi hủy đơn hàng' });
  }
};

module.exports = {
  checkout,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
};
