const express = require('express');
const router = express.Router();
const {
  checkout,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
} = require('../controllers/orderController');

router.post('/checkout', checkout);
router.get('/detail/:id', getOrderDetail);
router.put('/:id/cancel', cancelOrder);
router.get('/:userId', getUserOrders);

module.exports = router;
