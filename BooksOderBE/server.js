const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Book = require('./models/Book');
const Favorite = require('./models/Favorite');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const User = require('./models/User');

const app = express();
app.use(cors());
// Tăng giới hạn dung lượng JSON & URL-encoded lên 25MB để nhận ảnh Base64
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// 1. Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Đã kết nối thành công với MongoDB (BookStoreDB)'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

const PORT = process.env.PORT || 3000;

// ==========================================
// 📚 API SÁCH (BOOKS)
// ==========================================

// 1. Lấy danh sách Sách (GET)
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    // Format lại _id thành id cho React Native dễ xử lý
    const formattedBooks = books.map(book => ({
      id: book._id.toString(),
      _id: book._id.toString(),
      bookName: book.bookName,
      author: book.author,
      price: book.price,
      category: book.category,
      coverImage: book.coverImage
    }));
    res.json(formattedBooks);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. Thêm Sách mới (POST)
app.post('/books', async (req, res) => {
  try {
    const { bookName, author, price, category, coverImage } = req.body;
    const newBook = new Book({ bookName, author, price, category, coverImage });
    await newBook.save();
    res.status(201).json({ message: 'Thêm sách thành công', newBook });
  } catch (error) {
    console.error('Lỗi thêm sách:', error);
    res.status(500).json({ message: 'Lỗi server khi thêm sách', error });
  }
});

// 3. Cập nhật Sách (PUT)
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
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

// 4. Xóa Sách (DELETE) - Xóa luôn các tham chiếu trong Cart & Favorite
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);
    
    if (!deletedBook) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    // Dọn dẹp giỏ hàng và danh sách yêu thích có chứa sách đã xóa
    await Cart.deleteMany({ bookId: id });
    await Favorite.deleteMany({ bookId: id });
    
    res.status(200).json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Lỗi xóa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa', error });
  }
});

// ==========================================
// 🛒 API GIỎ HÀNG (CART)
// ==========================================

// 1. Lấy giỏ hàng của user
app.get('/cart/:userId', async (req, res) => {
  try {
    const cart = await Cart.find({ userId: req.params.userId }).populate('bookId');
    // Lọc bỏ những sản phẩm mà sách gốc không còn tồn tại trong DB
    const validCart = cart.filter(item => item.bookId !== null);
    res.json(validCart);
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
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. Cập nhật số lượng trực tiếp trong giỏ (PUT)
app.put('/cart/:id', async (req, res) => {
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
    res.status(500).json({ error: 'Lỗi server khi cập nhật giỏ hàng' });
  }
});

// 4. Xóa một sản phẩm khỏi giỏ hàng (DELETE)
app.delete('/cart/:id', async (req, res) => {
  try {
    const deleted = await Cart.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' });
    }
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm khỏi giỏ' });
  }
});

// ==========================================
// ❤️ API YÊU THÍCH (FAVORITES)
// ==========================================

// 1. Lấy danh sách yêu thích của user
app.get('/favorites/:userId', async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.params.userId }).populate('bookId');
    const validFavorites = favorites.filter(fav => fav.bookId !== null);
    res.json(validFavorites);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. Bật/Tắt yêu thích (Toggle)
app.post('/favorites', async (req, res) => {
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
    const cartItems = await Cart.find({ userId }).populate('bookId');
    const validCartItems = cartItems.filter(item => item.bookId !== null);
    
    if (validCartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    let totalAmount = 0;
    const orderItems = validCartItems.map(item => {
      totalAmount += item.bookId.price * item.quantity;
      return {
        bookId: item.bookId._id,
        quantity: item.quantity,
        price: item.bookId.price
      };
    });

    const newOrder = new Order({
      userId,
      items: orderItems,
      totalAmount,
      address
    });
    await newOrder.save();

    // Xóa toàn bộ giỏ hàng của user sau khi đặt thành công
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
                              .populate('items.bookId')
                              .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ==========================================
// 🔐 API XÁC THỰC (AUTH)
// ==========================================

// 1. Đăng ký tài khoản
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tài khoản này đã tồn tại!' });
    }

    const userRole = username.toLowerCase() === 'admin' ? 'admin' : 'user';

    const newUser = new User({ 
      username, 
      password,
      role: userRole 
    });
    
    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

// 2. Đăng nhập
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: 'fake-jwt-token-' + user._id,
      role: user.role,
      userId: user._id.toString()
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API đang chạy tại: http://localhost:${PORT}/books`);
});
