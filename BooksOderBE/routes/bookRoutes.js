const express = require('express');
const router = express.Router();
const {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

router.route('/')
  .get(getBooks)
  .post(addBook);

router.route('/:id')
  .put(updateBook)
  .delete(deleteBook);

module.exports = router;
