const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const notifications = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);
router.get('/', notifications.getNotifications);
router.put('/:id/read', notifications.markNotificationRead);

module.exports = router;
