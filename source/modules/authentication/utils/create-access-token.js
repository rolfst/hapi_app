import _ from 'lodash';
import moment from 'moment';
import tokenUtil from '../../../shared/utils/token';

export default (userId, deviceId, integrations) => {
  const payload = {
    type: 'access_token',
    exp: parseInt(moment().add(1, 'hour').format('X'), 10),
    iss: 'https://api.flex-appeal.nl',
    iat: parseInt(moment().format('X'), 10),
    sub: userId,
    device: deviceId,
    jti: _.random(1000000, 9999999),
    integrations,
  };

  return tokenUtil.encode(payload);
};
