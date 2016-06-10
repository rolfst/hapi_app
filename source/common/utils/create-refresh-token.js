import jwt from 'jwt-simple';
import _ from 'lodash';

export default (userId, deviceId) => {
  const payload = {
    type: 'refresh_token',
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
  };

  return jwt.encode(payload, process.env.JWT_SECRET);
};
