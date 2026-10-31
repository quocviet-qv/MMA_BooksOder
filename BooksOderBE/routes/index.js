const express = require('express');
const router = express.Router();

const bookRoutes = require('./bookRoutes');
const cartRoutes = require('./cartRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const orderRoutes = require('./orderRoutes');
const authRoutes = require('./authRoutes');
const reviewRoutes = require('./reviewRoutes');
const { checkout } = require('../controllers/orderController');

// Đăng ký các module routes (Đảm bảo giữ nguyên 100% các URL cũ)
router.use('/books', bookRoutes);
router.use('/cart', cartRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/orders', orderRoutes);
router.post('/checkout', checkout);
router.use('/', authRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;
