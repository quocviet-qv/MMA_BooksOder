const express = require('express');
const router = express.Router();
const {
  checkout,
  getUserOrders,
  getOrderDetail,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePayment,
  getDashboardStats,
} = require('../controllers/orderController');

router.get('/dashboard/stats', getDashboardStats); // GET /orders/dashboard/stats -> Thống kê Admin
router.get('/', getAllOrders); // GET /orders -> Admin xem tất cả đơn hàng
router.get('/detail/:id', getOrderDetail); // GET /orders/detail/:id
router.put('/:id/status', updateOrderStatus); // PUT /orders/:id/status -> Admin đổi trạng thái
router.put('/:id/payment', updatePayment); // PUT /orders/:id/payment -> Cập nhật trạng thái thanh toán
router.put('/:id/cancel', cancelOrder); // PUT /orders/:id/cancel -> User hủy đơn
router.get('/user/:userId', getUserOrders); // GET /orders/user/:userId -> Hỗ trợ route xem đơn theo user
router.get('/:userId', getUserOrders); // GET /orders/:userId -> User xem đơn của mình
router.post('/checkout', checkout);

module.exports = router;
