const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require('../controllers/cartController');

router.post('/', addToCart);
router.get('/:userId', getCart);
router.route('/:id')
  .put(updateCartItem)
  .delete(removeFromCart);

module.exports = router;
