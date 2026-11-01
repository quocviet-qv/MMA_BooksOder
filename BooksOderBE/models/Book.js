const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookName: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: 'Khác' },
    coverImage: { type: String, required: true },
    description: { type: String, default: '' },
    stock: { type: Number, default: 50, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);