const Favorite = require('../models/Favorite');

// @desc    Lấy danh sách yêu thích của người dùng
// @route   GET /favorites/:userId
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId }).populate('bookId');
    const validFavorites = favorites.filter((fav) => fav.bookId !== null);
    res.json(validFavorites);
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu thích:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// @desc    Bật/Tắt yêu thích (Toggle)
// @route   POST /favorites
const toggleFavorite = async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const existingFav = await Favorite.findOne({ userId, bookId });

    if (existingFav) {
      await Favorite.findByIdAndDelete(existingFav._id);
      return res.json({ message: 'Đã xóa khỏi danh sách yêu thích', status: 'removed' });
    } else {
      const newFav = new Favorite({ userId, bookId });
      await newFav.save();
      return res.json({ message: 'Đã thêm vào danh sách yêu thích', status: 'added' });
    }
  } catch (error) {
    console.error('Lỗi xử lý yêu thích:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
};
