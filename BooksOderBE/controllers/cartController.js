const Cart = require('../models/Cart');
const Book = require('../models/Book');
const fail = (status, message) => Object.assign(new Error(message), { status });
exports.getCart = async (req, res) => res.json((await Cart.find({ userId: req.user.id }).populate('bookId')).filter(item => item.bookId));
exports.addToCart = async (req, res) => {
  const { bookId, quantity = 1 } = req.body;
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw fail(400, 'Số lượng phải là số nguyên dương');
  const book = await Book.findById(bookId);
  if (!book) throw fail(404, 'Không tìm thấy sách');
  // The stock predicate is evaluated on the same atomic update as the increment.
  const current = await Cart.findOne({ userId: req.user.id, bookId });
  if (quantity + (current?.quantity || 0) > book.stock) throw fail(400, `Trong kho chỉ còn ${book.stock} cuốn`);
  const item = await Cart.findOneAndUpdate({ userId: req.user.id, bookId, quantity: { $lte: book.stock - quantity } }, { $inc: { quantity }, $setOnInsert: { userId: req.user.id, bookId } }, { upsert: !current, returnDocument: 'after' });
  if (!item) throw fail(409, 'Giỏ hàng vừa thay đổi, vui lòng thử lại');
  res.json(item);
};
exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw fail(400, 'Số lượng phải là số nguyên dương');
  const item = await Cart.findOne({ _id: req.params.id, userId: req.user.id }).populate('bookId');
  if (!item) throw fail(404, 'Không tìm thấy sản phẩm trong giỏ');
  if (!item.bookId || quantity > item.bookId.stock) throw fail(400, 'Số lượng vượt quá tồn kho');
  item.quantity = quantity;
  await item.save();
  res.json(item);
};
exports.removeFromCart = async (req, res) => {
  const deleted = await Cart.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) throw fail(404, 'Không tìm thấy sản phẩm trong giỏ');
  res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
};
