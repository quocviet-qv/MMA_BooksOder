const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Hàm tạo JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'supersecretjwtkey_bookstore_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Đăng ký tài khoản (Mã hóa mật khẩu bằng bcrypt)
// @route   POST /register
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Tài khoản này đã tồn tại!' });
    }

    // Tự động phân quyền: Nếu username là "admin" thì là admin, còn lại là user
    const userRole = username.trim().toLowerCase() === 'admin' ? 'admin' : 'user';

    // Mã hóa mật khẩu an toàn
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.trim(),
      password: hashedPassword,
      role: userRole,
    });

    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// @desc    Đăng nhập tài khoản (Kiểm tra mật khẩu hash và cấp JWT token)
// @route   POST /login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // Kiểm tra mật khẩu (Hỗ trợ cả bcrypt hash lẫn mật khẩu cũ chưa hash)
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
      // Nâng cấp tự động mật khẩu cũ lên bcrypt
      if (isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // Cấp Token JWT chuẩn bảo mật
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      role: user.role,
      userId: user._id.toString(),
      username: user.username,
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
  }
};

// @desc    Đổi mật khẩu tài khoản
// @route   POST /change-password
const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra mật khẩu cũ
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(oldPassword, user.password);
    } else {
      isMatch = user.password === oldPassword;
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Mã hóa mật khẩu mới và lưu
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
  }
};

// @desc    Lấy thông tin hồ sơ người dùng
// @route   GET /profile/:userId
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json(user);
  } catch (error) {
    console.error('Lỗi lấy thông tin hồ sơ:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin hồ sơ' });
  }
};

module.exports = {
  register,
  login,
  changePassword,
  getUserProfile,
};
