// middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
