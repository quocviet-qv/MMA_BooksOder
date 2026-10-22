const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Book = require('./models/Book');
const Favorite = require('./models/Favorite');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const User = require('./models/User'); // Nhớ trỏ đúng đường dẫn tới file User.js vừa tạo

const app = express();
app.use(cors());
app.use(express.json());

// 1. Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Đã kết nối thành công với MongoDB (BookStoreDB)'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// 2. API Lấy danh sách Sách (GET)
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    // Format lại _id thành id cho React Native dễ xử lý
    const formattedBooks = books.map(book => ({
      id: book._id.toString(),
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
      address
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
    
    res.status(200).json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Lỗi xóa sách:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa', error });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend API đang chạy tại: http://localhost:${PORT}/books`);
});