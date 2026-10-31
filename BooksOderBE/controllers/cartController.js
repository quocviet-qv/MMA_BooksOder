const Cart = require('../models/Cart');

// @desc    Lấy giỏ hàng của người dùng
// @route   GET /cart/:userId
const getCart = async (req, res) => {
  try {
    const cart = await Cart.find({ userId: req.params.userId }).populate('bookId');
    // Lọc bỏ những sản phẩm mà sách gốc đã bị xóa
    const validCart = cart.filter((item) => item.bookId !== null);
    res.json(validCart);
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// @desc    Thêm hoặc tăng số lượng sách trong giỏ
// @route   POST /cart
const addToCart = async (req, res) => {
  const { userId, bookId, quantity = 1 } = req.body;
  try {
    let cartItem = await Cart.findOne({ userId, bookId });

    if (cartItem) {
      cartItem.quantity += quantity;
      if (cartItem.quantity <= 0) {
        await Cart.findByIdAndDelete(cartItem._id);
        return res.json({ message: 'Đã xóa khỏi giỏ hàng', deleted: true });
      }
      await cartItem.save();
    } else if (quantity > 0) {
      cartItem = new Cart({ userId, bookId, quantity });
      await cartItem.save();
    }
    res.json(cartItem);
  } catch (error) {
    console.error('Lỗi thêm vào giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// @desc    Cập nhật trực tiếp số lượng một sản phẩm trong giỏ
// @route   PUT /cart/:id
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity <= 0) {
      await Cart.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Đã xóa khỏi giỏ hàng', deleted: true });
    }

    const updatedItem = await Cart.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true }
    ).populate('bookId');

    if (!updatedItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật giỏ hàng' });
  }
};

// @desc    Xóa một sản phẩm khỏi giỏ hàng
// @route   DELETE /cart/:id
const removeFromCart = async (req, res) => {
  try {
    const deleted = await Cart.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' });
    }
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (error) {
    console.error('Lỗi xóa sản phẩm khỏi giỏ:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm khỏi giỏ' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
};
