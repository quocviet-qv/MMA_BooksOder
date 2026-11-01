const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token đăng nhập (JWT)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey_bookstore_2026'
      );

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Người dùng không tồn tại hoặc token hết hạn' });
      }

      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error.message);
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  } else {
    return res.status(401).json({ message: 'Không có token xác thực, truy cập bị từ chối' });
  }
};

const optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next();
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
  try {
    const decoded = jwt.verify(
      authorization.split(' ')[1],
      process.env.JWT_SECRET || 'supersecretjwtkey_bookstore_2026'
    );
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Người dùng không tồn tại hoặc token hết hạn' });
    next();
  } catch (error) {
    console.error('Lỗi xác thực token:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Middleware kiểm tra quyền Quản trị viên (Admin)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Yêu cầu quyền Quản trị viên (Admin)' });
  }
};

const ownAccount = (req, res, next) => {
  if (req.params.userId && req.params.userId !== req.user.id) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập tài khoản này' });
  }
  if (req.body) req.body.userId = req.user.id;
  next();
};
module.exports = { protect, optionalProtect, adminOnly, ownAccount };
