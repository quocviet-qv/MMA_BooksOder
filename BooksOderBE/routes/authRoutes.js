const express = require('express');
const router = express.Router();
const {
  register,
  login,
  changePassword,
  getUserProfile,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.get('/profile/:userId', getUserProfile);

module.exports = router;
