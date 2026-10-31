const Favorite = require('../models/Favorite');
const Book = require('../models/Book');
exports.getFavorites = async (req, res) => res.json((await Favorite.find({ userId: req.user.id }).populate('bookId')).filter(i => i.bookId));
exports.toggleFavorite = async (req, res) => {
  const { bookId } = req.body;
  if (!await Book.exists({ _id: bookId })) return res.status(404).json({ message: 'Không tìm thấy sách' });
  const existing = await Favorite.findOneAndDelete({ userId: req.user.id, bookId });
  if (existing) return res.json({ status: 'removed' });
  await Favorite.updateOne({ userId: req.user.id, bookId }, { $setOnInsert: { userId: req.user.id, bookId } }, { upsert: true });
  res.json({ status: 'added' });
};
