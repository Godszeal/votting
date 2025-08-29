const { protect } = require('./auth');
const ErrorResponse = require('./errorResponse');

const admin = (req, res, next) => {
  protect(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      next(new ErrorResponse('Not authorized as an admin', 403));
    }
  });
};

module.exports = { admin };
