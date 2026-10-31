const express = require('express');
const router = express.Router();
const {
  getFavorites,
  toggleFavorite,
} = require('../controllers/favoriteController');

router.post('/', toggleFavorite);
router.get('/:userId', getFavorites);

module.exports = router;
