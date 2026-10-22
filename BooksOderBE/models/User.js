const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true // Đảm bảo không ai đăng ký trùng tên
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' // Mặc định ai đăng ký cũng là user bình thường
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);