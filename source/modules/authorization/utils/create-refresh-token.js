const _ = require('lodash');
const tokenUtil = require('../../../shared/utils/token');

module.exports = (userId, deviceId) => {
  const payload = {
    type: 'refresh_token',
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
  };

  return tokenUtil.encode(payload);
};
