const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Thanh toán (Kiểm tra tồn kho, trừ tồn kho & Tạo đơn hàng)
// @route   POST /checkout
const checkout = async (req, res) => {
  const { userId, address } = req.body;
  try {
    const cartItems = await Cart.find({ userId }).populate('bookId');
    const validCartItems = cartItems.filter((item) => item.bookId !== null);

    if (validCartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    // 1. Kiểm tra tồn kho trước khi đặt hàng
    for (const item of validCartItems) {
      const book = item.bookId;
      if (book.stock !== undefined && book.stock < item.quantity) {
        return res.status(400).json({
          message: `Sách "${book.bookName}" trong kho chỉ còn ${book.stock} cuốn, không đủ số lượng ${item.quantity} bạn yêu cầu!`,
        });
      }
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

    // 2. Tự động trừ số lượng sách trong kho
    for (const item of validCartItems) {
      await Book.findByIdAndUpdate(item.bookId._id, {
        $inc: { stock: -item.quantity },
      });
    }

    // 3. Dọn sạch giỏ hàng của user sau khi đặt thành công
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

    // Hoàn trả lại số lượng tồn kho khi hủy đơn
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.bookId) {
          await Book.findByIdAndUpdate(item.bookId, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    order.status = 'Đã hủy';
    await order.save();

    res.json({ message: 'Hủy đơn hàng thành công', order });
  } catch (error) {
    console.error('Lỗi hủy đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi hủy đơn hàng' });
  }
};

// @desc    Lấy toàn bộ đơn hàng của tất cả khách hàng (Dành cho Admin)
// @route   GET /orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.bookId')
      .sort({ createdAt: -1 });

    const users = await User.find({}, 'username');
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u.username;
    });

    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.customerName = userMap[order.userId] || order.userId || 'Khách hàng';
      return orderObj;
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error('Lỗi lấy toàn bộ đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách đơn hàng' });
  }
};

// @desc    Admin cập nhật trạng thái đơn hàng (Chờ xác nhận -> Đang vận chuyển -> Hoàn thành / Đã hủy)
// @route   PUT /orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Chờ xác nhận', 'Đang vận chuyển', 'Hoàn thành', 'Đã hủy'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Phải là: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(id).populate('items.bookId');
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Nếu chuyển sang Đã hủy và đơn trước đó chưa hủy -> Hoàn tồn kho
    if (status === 'Đã hủy' && order.status !== 'Đã hủy') {
      for (const item of order.items) {
        if (item.bookId) {
          await Book.findByIdAndUpdate(item.bookId._id, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    order.status = status;
    await order.save();

    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái đơn hàng' });
  }
};

// @desc    Lấy số liệu thống kê Dashboard tổng hợp (Dành cho Admin)
// @route   GET /orders/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const [orders, books] = await Promise.all([
      Order.find().populate('items.bookId'),
      Book.find(),
    ]);

    let totalRevenue = 0;
    let pendingCount = 0;
    let shippingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    const bookSalesMap = {};

    orders.forEach((ord) => {
      if (ord.status === 'Hoàn thành' || ord.status === 'Đã giao') {
        totalRevenue += ord.totalAmount || 0;
        completedCount++;

        // Thống kê sách bán chạy từ đơn hoàn thành
        (ord.items || []).forEach((item) => {
          if (item.bookId) {
            const bId = item.bookId._id.toString();
            if (!bookSalesMap[bId]) {
              bookSalesMap[bId] = {
                id: bId,
                bookName: item.bookId.bookName,
                coverImage: item.bookId.coverImage,
                price: item.bookId.price,
                totalSold: 0,
              };
            }
            bookSalesMap[bId].totalSold += item.quantity || 1;
          }
        });
      } else if (ord.status === 'Chờ xác nhận' || ord.status === 'Đang xử lý') {
        pendingCount++;
      } else if (ord.status === 'Đang vận chuyển' || ord.status === 'Đang giao') {
        shippingCount++;
      } else if (ord.status === 'Đã hủy') {
        cancelledCount++;
      }
    });

    const topSellingBooks = Object.values(bookSalesMap)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const totalStock = books.reduce((sum, b) => sum + (b.stock || 0), 0);

    res.json({
      totalRevenue,
      totalOrders: orders.length,
      pendingCount,
      shippingCount,
      completedCount,
      cancelledCount,
      totalBooks: books.length,
      totalStock,
      topSellingBooks,
    });
  } catch (error) {
    console.error('Lỗi tính thống kê Dashboard:', error);
    res.status(500).json({ error: 'Lỗi server khi tính thống kê Dashboard' });
  }
};

module.exports = {
  checkout,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
};
