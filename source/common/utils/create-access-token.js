import jwt from 'jwt-simple';
import _ from 'lodash';
import moment from 'moment';

export default (userId, deviceId) => {
  const payload = {
    type: 'access_token',
    exp: moment().add(1, 'hour').format('X'),
    iss: 'https://api.flex-appeal.nl',
    iat: moment().format('X'),
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
  };

  return jwt.encode(payload, process.env.JWT_SECRET);
};
