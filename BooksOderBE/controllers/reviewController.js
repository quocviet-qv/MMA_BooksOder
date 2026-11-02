const mongoose = require('mongoose');
const Review = require('../models/Review');
const Book = require('../models/Book');
const Order = require('../models/Order');
const fail = (status, message) => Object.assign(new Error(message), { status });
const deliveredStatuses = ['Completed', 'Delivered', 'Hoàn thành', 'Đã giao'];

// @desc    Lấy danh sách đánh giá của một cuốn sách kèm phân bố sao
// @route   GET /reviews/:bookId
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const deliveredOrders = await Order.find({
      'items.bookId': bookId,
      status: { $in: deliveredStatuses },
    }).select('userId').lean();
    const verifiedUserIds = [...new Set(deliveredOrders.map(order => order.userId))];
    const reviews = await Review.find({
      bookId,
      userId: { $in: verifiedUserIds },
    }).sort({ createdAt: -1 });

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

    const eligibility = req.user ? await canReviewBook(bookId, req.user.id) : null;
    res.json({
      reviews,
      totalReviews,
      averageRating,
      ratingCounts,
      ...(eligibility && {
        canReview: eligibility.canReview,
        hasReviewed: eligibility.hasReviewed,
        review: eligibility.review,
      }),
    });
  } catch (error) {
    console.error('Lỗi tải đánh giá:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy đánh giá' });
  }
};

const canReviewBook = async (bookId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) throw fail(400, 'Mã sách không hợp lệ');
  if (!await Book.exists({ _id: bookId })) throw fail(404, 'Không tìm thấy sách');
  const [deliveredOrder, review] = await Promise.all([
    Order.exists({
      userId,
      status: { $in: deliveredStatuses },
      'items.bookId': bookId,
    }),
    Review.findOne({ bookId, userId }).sort({ createdAt: -1 }),
  ]);
  return { canReview: !!deliveredOrder, hasReviewed: !!review, review };
};

const canReview = async (req, res) => {
  const result = await canReviewBook(req.params.id, req.user.id);
  res.json({
    canReview: result.canReview,
    hasReviewed: result.hasReviewed,
    review: result.review,
  });
};

const addReview = async (req, res) => {
  const bookId = req.params.id || req.body.bookId;
  const { rating, comment } = req.body;
  if (!mongoose.Types.ObjectId.isValid(bookId)) throw fail(400, 'Mã sách không hợp lệ');
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    throw fail(400, 'Số sao phải từ 1 đến 5.');
  }
  if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > 2000) {
    throw fail(400, 'Vui lòng nhập nhận xét (tối đa 2000 ký tự).');
  }

  let review;
  let isNew = false;
  try {
    await mongoose.connection.transaction(async session => {
      if (!await Book.exists({ _id: bookId }).session(session)) throw fail(404, 'Không tìm thấy sách');
      const deliveredOrder = await Order.exists({
        userId: req.user.id,
        status: { $in: deliveredStatuses },
        'items.bookId': bookId,
      }).session(session);
      if (!deliveredOrder) throw fail(403, 'Bạn cần mua và nhận sách thành công mới được đánh giá');

      review = await Review.findOne({ bookId, userId: req.user.id }).session(session);
      if (review) {
        review.rating = Number(rating);
        review.comment = comment.trim();
        review.username = req.user.username;
        await review.save({ session });
        await Review.deleteMany(
          { bookId, userId: req.user.id, _id: { $ne: review._id } },
          { session }
        );
      } else {
        [review] = await Review.create([{
          bookId,
          userId: req.user.id,
          username: req.user.username,
          rating: Number(rating),
          comment: comment.trim(),
        }], { session });
        isNew = true;
      }

      const verifiedOrders = await Order.find({
        status: { $in: deliveredStatuses },
        'items.bookId': bookId,
      }).select('userId').session(session);
      const verifiedUserIds = [...new Set(verifiedOrders.map(order => order.userId))];
      const [summary] = await Review.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(bookId), userId: { $in: verifiedUserIds } } },
        { $group: { _id: '$bookId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
      ]).session(session);
      await Book.updateOne(
        { _id: bookId },
        { $set: { averageRating: Math.round((summary?.averageRating || 0) * 10) / 10, totalReviews: summary?.totalReviews || 0 } },
        { session }
      );
    });
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Gửi đánh giá thành công' : 'Cập nhật đánh giá thành công',
      review,
    });
  } catch (error) {
    if (!error.status || error.status >= 500) console.error('Lỗi lưu đánh giá:', error.message);
    throw error;
  }
};

module.exports = {
  getBookReviews,
  canReview,
  addReview,
};
