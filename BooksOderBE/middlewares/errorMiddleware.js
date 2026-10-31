// Middleware xử lý khi không tìm thấy route (404)
const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy đường dẫn - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware xử lý lỗi toàn cục (Global Error Handler)
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || (err.name === 'CastError' || err.name === 'ValidationError' ? 400 : err.code === 11000 ? 409 : res.statusCode === 200 ? 500 : res.statusCode);
  console.error(`❌ [Error ${statusCode}]:`, err.message);

  res.status(statusCode).json({
    message: err.message || 'Lỗi máy chủ nội bộ',
  });
};

module.exports = { notFound, errorHandler };
