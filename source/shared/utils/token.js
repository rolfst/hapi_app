const jwt = require('jwt-simple');

exports.encode = (payload) => {
  return jwt.encode(payload, process.env.JWT_SECRET);
};
exports.decode = (token) => {
  return jwt.decode(token, process.env.JWT_SECRET);
};
