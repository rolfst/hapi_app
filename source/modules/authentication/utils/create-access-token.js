import _ from 'lodash';
import moment from 'moment';
import tokenUtil from '../../../shared/utils/token';

export default (userId, deviceId) => {
  const payload = {
    type: 'access_token',
    exp: moment().add(1, 'hour').unix(),
    iss: 'https://api.flex-appeal.nl',
    iat: moment().unix(),
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
  };

  return tokenUtil.encode(payload);
};
