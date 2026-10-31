const express = require('express');
const router = express.Router();
const { getBookReviews, addReview } = require('../controllers/reviewController');

router.post('/', addReview);
router.get('/:bookId', getBookReviews);

module.exports = router;
