import _ from 'lodash';
import tokenUtil from '../../../shared/utils/token';

export default (userId, deviceId) => {
  const payload = {
    type: 'refresh_token',
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
  };

  return tokenUtil.encode(payload);
};
