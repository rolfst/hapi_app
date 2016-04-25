import jwt from 'jwt-simple';

export default {
  decodeToken: token => jwt.decode(token, process.env.JWT_SECRET),
};
