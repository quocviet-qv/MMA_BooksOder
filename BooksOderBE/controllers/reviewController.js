const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Lấy danh sách đánh giá của một cuốn sách kèm phân bố sao
// @route   GET /reviews/:bookId
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0;

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating]++;
      }
    });

    res.json({
      reviews,
      totalReviews,
      averageRating,
      ratingCounts,
    });
  } catch (error) {
    console.error('Lỗi tải đánh giá:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy đánh giá' });
  }
};

// @desc    Thêm đánh giá mới cho sách
// @route   POST /reviews
const addReview = async (req, res) => {
  try {
    const { bookId, userId, rating, comment } = req.body;

    if (!bookId || !userId || !rating || !comment) {
      return res.status(400).json({ message: 'Vui lòng chọn số sao và nhập nhận xét.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Số sao phải từ 1 đến 5.' });
    }

    // Lấy username từ User collection nếu có
    let username = 'Khách hàng';
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user && user.username) username = user.username;
    } else if (typeof userId === 'string' && userId.trim()) {
      username = userId;
    }

    const newReview = new Review({
      bookId,
      userId,
      username,
      rating: numRating,
      comment: comment.trim(),
    });

    await newReview.save();

    // Tính lại điểm trung bình sau khi thêm
    const allReviews = await Review.find({ bookId });
    const averageRating =
      Math.round(
        (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
      ) / 10;

    res.status(201).json({
      message: 'Gửi đánh giá thành công',
      review: newReview,
      averageRating,
      totalReviews: allReviews.length,
    });
  } catch (error) {
    console.error('Lỗi lưu đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu đánh giá', error });
  }
};

module.exports = {
  getBookReviews,
  addReview,
};
