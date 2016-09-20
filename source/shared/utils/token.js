import jwt from 'jwt-simple';

export default {
  encode(payload) {
    return jwt.encode(payload, process.env.JWT_SECRET);
  },
  decode(token) {
    return jwt.decode(token, process.env.JWT_SECRET);
  },
};
