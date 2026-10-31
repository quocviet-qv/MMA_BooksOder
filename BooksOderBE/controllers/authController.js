const User = require('../models/User');

// @desc    Đăng ký tài khoản
// @route   POST /register
const register = async (req, res) => {
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
      role: userRole,
    });

    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// @desc    Đăng nhập tài khoản
// @route   POST /login
const login = async (req, res) => {
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
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

module.exports = {
  register,
  login,
};
