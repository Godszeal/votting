const auth = require('./auth');

const admin = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    next();
  });
};

module.exports = admin;