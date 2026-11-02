const Book = require('../models/Book');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const fail = (status, message) => Object.assign(new Error(message), { status });
function input(body) {
  const { bookName, author, category, description = '' } = body;
  let coverImage = typeof body.coverImage === 'string' ? body.coverImage.trim() : '';
  const price = Number(body.price), stock = Number(body.stock ?? 50);
  if ([bookName, author, category, coverImage].some(v => typeof v !== 'string' || !v.trim()) || typeof description !== 'string') throw fail(400, 'Vui lòng nhập tên sách, tác giả, thể loại và ảnh bìa');
  if (![price, stock].every(Number.isSafeInteger) || price <= 0 || stock < 0) throw fail(400, 'Giá phải là số nguyên dương, tồn kho là số nguyên không âm');
  
  // Tự động chuẩn hóa nếu người dùng gửi raw Base64 chưa có tiền tố data:image/
  if (!coverImage.startsWith('data:') && !/^https?:\/\//i.test(coverImage)) {
    const cleanBase64 = coverImage.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleanBase64) && cleanBase64.length > 50) {
      coverImage = `data:image/jpeg;base64,${cleanBase64}`;
    }
  }

  if (!/^https?:\/\//i.test(coverImage) && !/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(coverImage)) {
    throw fail(400, 'Ảnh bìa phải là chuỗi Base64 hợp lệ (data:image/...;base64,...) hoặc URL ảnh');
  }
  return { bookName: bookName.trim(), author: author.trim(), category: category.trim(), coverImage, description: description.trim(), price, stock };
}
exports.getBooks = async (_req, res) => {
  const [books, stats] = await Promise.all([
    Book.find().sort({ createdAt: -1 }).lean(),
    Review.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { reviewBookId: '$bookId', reviewUserId: '$userId' },
          pipeline: [{
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$reviewUserId'] },
                  {
                    $gt: [{
                      $size: {
                        $filter: {
                          input: '$items',
                          as: 'item',
                          cond: { $eq: ['$$item.bookId', '$$reviewBookId'] },
                        },
                      },
                    }, 0],
                  },
                  { $in: ['$status', ['Completed', 'Delivered', 'Hoàn thành', 'Đã giao']] },
                ],
              },
            },
          }],
          as: 'deliveredOrders',
        },
      },
      { $match: { $expr: { $gt: [{ $size: '$deliveredOrders' }, 0] } } },
      { $group: { _id: '$bookId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]),
  ]);
  const ratings = Object.fromEntries(stats.map(s => [String(s._id), s]));
  res.json(books.map(b => ({ ...b, id: String(b._id), averageRating: Math.round((ratings[b._id]?.averageRating || 0) * 10) / 10, totalReviews: ratings[b._id]?.totalReviews || 0 })));
};
exports.getBookById = async (req, res) => {
  const book = await Book.findById(req.params.id).lean();
  if (!book) throw fail(404, 'Không tìm thấy sách');
  res.json({ ...book, id: String(book._id) });
};
exports.addBook = async (req, res) => res.status(201).json({ message: 'Đã thêm sách', newBook: await Book.create(input(req.body)) });
exports.updateBook = async (req, res) => {
  const updatedBook = await Book.findByIdAndUpdate(req.params.id, { $set: input(req.body) }, { returnDocument: 'after', runValidators: true });
  if (!updatedBook) throw fail(404, 'Không tìm thấy sách');
  res.json({ message: 'Đã cập nhật sách', updatedBook });
};
exports.deleteBook = async (req, res) => {
  if (!await Book.findByIdAndDelete(req.params.id)) throw fail(404, 'Không tìm thấy sách');
  await Promise.all([Cart.deleteMany({ bookId: req.params.id }), Favorite.deleteMany({ bookId: req.params.id }), Review.deleteMany({ bookId: req.params.id })]);
  res.json({ message: 'Đã xóa sách' });
};
