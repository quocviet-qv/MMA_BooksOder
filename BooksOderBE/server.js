const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Book = require('./models/Book');
const Favorite = require('./models/Favorite');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const User = require('./models/User'); // Nhớ trỏ đúng đường dẫn tới file User.js vừa tạo
const Review = require('./models/Review');

const app = express();
app.use(cors());
// Tăng giới hạn dung lượng JSON để nhận ảnh Base64
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// 1. Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Đã kết nối thành công với MongoDB (BookStoreDB)'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// 2. API Lấy danh sách Sách (GET) - kèm Điểm đánh giá trung bình
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    // Lấy thống kê đánh giá trung bình theo từng cuốn sách
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$bookId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    reviewStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews
      };
    });

    // Format lại _id thành id cho React Native dễ xử lý
    const formattedBooks = books.map(book => {
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
        averageRating: stat.averageRating,
        totalReviews: stat.totalReviews
      };
    });

    res.json(formattedBooks);
  } catch (error) {
    console.error('Lỗi lấy danh sách sách:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. API Thêm Sách mới (POST)
app.post('/books', async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
  }
});

// 4. Khởi chạy Server
const PORT = process.env.PORT || 3000;
// ==========================================
// 🛒 API GIỎ HÀNG
// ==========================================

// 1. Lấy giỏ hàng của user
app.get('/cart/:userId', async (req, res) => {
  try {
    // .populate('bookId') sẽ tự động nhúng toàn bộ thông tin sách vào kết quả trả về
    const cart = await Cart.find({ userId: req.params.userId }).populate('bookId');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. Thêm/Cập nhật sách trong giỏ
app.post('/cart', async (req, res) => {
  const { userId, bookId, quantity = 1 } = req.body;
  try {
    let cartItem = await Cart.findOne({ userId, bookId });
    
    if (cartItem) {
      // Nếu đã có trong giỏ, cộng dồn số lượng
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // Nếu chưa có, tạo mới
      cartItem = new Cart({ userId, bookId, quantity });
      await cartItem.save();
    }
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ==========================================
// ❤️ API YÊU THÍCH
// ==========================================

// 1. Lấy danh sách yêu thích của user
app.get('/favorites/:userId', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId }).populate('bookId');
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. Bật/Tắt yêu thích (Toggle)
app.post('/favorites', async (req, res) => {
  const { userId, bookId } = req.body;
  try {
    const existingFav = await Favorite.findOne({ userId, bookId });
    
    // Nếu đang yêu thích thì Xóa, nếu chưa thì Thêm
    if (existingFav) {
      await Favorite.findByIdAndDelete(existingFav._id);
      return res.json({ message: 'Đã xóa khỏi danh sách yêu thích', status: 'removed' });
    } else {
      const newFav = new Favorite({ userId, bookId });
      await newFav.save();
      return res.json({ message: 'Đã thêm vào danh sách yêu thích', status: 'added' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ==========================================
// 📦 API ĐƠN HÀNG (ORDER & CHECKOUT)
// ==========================================

// 1. Thanh toán (Tạo đơn hàng & Xóa giỏ hàng)
app.post('/checkout', async (req, res) => {
  const { userId, address } = req.body;
  try {
    // Bước 1: Lấy toàn bộ sách trong giỏ hàng của user này
    const cartItems = await Cart.find({ userId }).populate('bookId');
    
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    // Bước 2: Tính tổng tiền và trích xuất dữ liệu lưu vào đơn hàng
    let totalAmount = 0;
    const orderItems = cartItems.map(item => {
      totalAmount += item.bookId.price * item.quantity;
      return {
        bookId: item.bookId._id,
        quantity: item.quantity,
        price: item.bookId.price
      };
    });

    // Bước 3: Tạo đơn hàng mới lưu vào DB
    const newOrder = new Order({
      userId,
      items: orderItems,
      totalAmount,
      address,
      status: 'Chờ xác nhận'
    });
    await newOrder.save();

    // Bước 4: Xóa toàn bộ giỏ hàng của user sau khi đặt thành công
    await Cart.deleteMany({ userId });

    res.status(201).json({ message: 'Đặt hàng thành công', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xử lý thanh toán' });
  }
});

// 2. Lấy lịch sử đơn hàng của user
app.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
                              .populate('items.bookId') // Nhúng thông tin sách vào lịch sử
                              .sort({ createdAt: -1 }); // Đơn mới nhất lên đầu
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. Lấy chi tiết một đơn hàng theo ID
app.get('/orders/detail/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.bookId');
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết đơn hàng' });
  }
});

// 4. Hủy đơn hàng (dành cho User khi đơn còn ở trạng thái Chờ xác nhận / Đang xử lý)
app.put('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const cancelableStatuses = ['Chờ xác nhận', 'Đang xử lý'];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Không thể hủy đơn hàng khi đang ở trạng thái "${order.status}".` 
      });
    }

    order.status = 'Đã hủy';
    await order.save();

    res.json({ message: 'Hủy đơn hàng thành công', order });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi hủy đơn hàng' });
  }
});

// ==========================================
// ==========================================
// API ĐĂNG KÝ TÀI KHOẢN (Đã thêm mẹo tạo Admin)
// ==========================================
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tài khoản này đã tồn tại!' });
    }

    // TỰ ĐỘNG CẤP QUYỀN: Nếu username là "admin" thì set role là "admin", ngược lại là "user"
    const userRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';

    const newUser = new User({ 
      username: username, 
      password: password,
      role: userRole 
    });
    
    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// ==========================================
// API ĐĂNG NHẬP
// ==========================================
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user theo username
    const user = await User.findOne({ username });
    
    // Nếu không thấy user HOẶC sai mật khẩu
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // Đăng nhập thành công, trả về thông tin để Frontend lưu vào AsyncStorage
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: 'fake-jwt-token-' + user._id, // Thực tế sẽ dùng thư viện jsonwebtoken (JWT)
      role: user.role,
      userId: user._id
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// ==========================================
// 1. API THÊM SÁCH MỚI (POST)
// ==========================================
app.post('/books', async (req, res) => {
  try {
    // Lấy dữ liệu từ form AdminFormScreen gửi lên
    const { bookName, author, price, category, coverImage } = req.body;
    
    // Tạo record mới và lưu vào MongoDB
    const newBook = new Book({ bookName, author, price, category, coverImage });
    await newBook.save();
    
    res.status(201).json({ message: 'Thêm sách thành công', newBook });
  } catch (error) {
    console.error('Lỗi thêm sách:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm sách', error });
  }
});

// ==========================================
// 2. API CẬP NHẬT SÁCH (PUT)
// ==========================================
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    
    // Tìm sách theo ID và cập nhật data mới (new: true để trả về data sau khi update)
    const updatedBook = await Book.findByIdAndUpdate(id, updatedData, { new: true });
    
    if (!updatedBook) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }
    
    res.status(200).json({ message: 'Cập nhật thành công', updatedBook });
  } catch (error) {
    console.error('Lỗi sửa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật', error });
  }
});

// ==========================================
// 3. API XÓA SÁCH (DELETE)
// ==========================================
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm và xóa sách khỏi MongoDB
    const deletedBook = await Book.findByIdAndDelete(id);
    
    if (!deletedBook) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    // Dọn dẹp các dữ liệu liên quan đến sách đã xóa
    await Cart.deleteMany({ bookId: id });
    await Favorite.deleteMany({ bookId: id });
    await Review.deleteMany({ bookId: id });
    
    res.status(200).json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Lỗi xóa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa', error });
  }
});

// ==========================================
// ⭐ API ĐÁNH GIÁ & BÌNH LUẬN (REVIEWS)
// ==========================================

// 1. Lấy danh sách đánh giá của một cuốn sách
app.get('/reviews/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

    // Thống kê phân bố số sao (1 đến 5 sao)
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating]++;
      }
    });

    res.json({
      reviews,
      totalReviews,
      averageRating,
      ratingCounts
    });
  } catch (error) {
    console.error('Lỗi tải đánh giá:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy đánh giá' });
  }
});

// 2. Thêm đánh giá mới cho sách (POST)
app.post('/reviews', async (req, res) => {
  try {
    const { bookId, userId, rating, comment } = req.body;

    if (!bookId || !userId || !rating || !comment) {
      return res.status(400).json({ message: 'Vui lòng chọn số sao và nhập nhận xét.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Số sao phải từ 1 đến 5.' });
    }

    // Lấy username thực tế của user từ User collection nếu có
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
      comment: comment.trim()
    });

    await newReview.save();

    // Tính lại điểm trung bình sau khi thêm
    const allReviews = await Review.find({ bookId });
    const averageRating = Math.round(
      (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10
    ) / 10;

    res.status(201).json({
      message: 'Gửi đánh giá thành công',
      review: newReview,
      averageRating,
      totalReviews: allReviews.length
    });
  } catch (error) {
    console.error('Lỗi lưu đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu đánh giá', error });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API đang chạy tại: http://localhost:${PORT}/books`);
});