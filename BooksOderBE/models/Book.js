const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookName: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Khác' },
  coverImage: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);