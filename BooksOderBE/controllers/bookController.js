const Book = require('../models/Book');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');

// @desc    Lấy danh sách tất cả sách kèm thống kê đánh giá, mô tả và tồn kho
// @route   GET /books
const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    // Lấy thống kê đánh giá trung bình theo từng cuốn sách
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$bookId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {};
    reviewStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews,
      };
    });

    const formattedBooks = books.map((book) => {
      const idStr = book._id.toString();
      const stat = statsMap[idStr] || { averageRating: 0, totalReviews: 0 };
      return {
        id: idStr,
        _id: idStr,
        bookName: book.bookName,
        author: book.author,
        price: book.price,
        category: book.category,
        coverImage: book.coverImage,
        description: book.description || '',
        stock: book.stock !== undefined ? book.stock : 50,
        averageRating: stat.averageRating,
        totalReviews: stat.totalReviews,
      };
    });

    res.json(formattedBooks);
  } catch (error) {
    console.error('Lỗi lấy danh sách sách:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// @desc    Thêm sách mới (kèm mô tả và số lượng tồn kho)
// @route   POST /books
const addBook = async (req, res) => {
  try {
    const { bookName, author, price, category, coverImage, description, stock } = req.body;
    const newBook = new Book({
      bookName,
      author,
      price: Number(price),
      category: category || 'Khác',
      coverImage,
      description: description || '',
      stock: stock !== undefined && stock !== '' ? Number(stock) : 50,
    });
    await newBook.save();

    res.status(201).json({ message: 'Thêm sách thành công', newBook });
  } catch (error) {
    console.error('Lỗi thêm sách:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm sách', error });
  }
};

// @desc    Cập nhật thông tin sách
// @route   PUT /books/:id
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.stock !== undefined && updateData.stock !== '') {
      updateData.stock = Number(updateData.stock);
    }

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    res.status(200).json({ message: 'Cập nhật thành công', updatedBook });
  } catch (error) {
    console.error('Lỗi sửa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật', error });
  }
};

// @desc    Xóa sách và dọn dẹp các bản ghi liên quan (Cart, Favorite, Review)
// @route   DELETE /books/:id
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    // Cascade delete các dữ liệu liên quan
    await Cart.deleteMany({ bookId: id });
    await Favorite.deleteMany({ bookId: id });
    await Review.deleteMany({ bookId: id });

    res.status(200).json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Lỗi xóa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa', error });
  }
};

module.exports = {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
};
