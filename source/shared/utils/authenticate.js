const { pick } = require('lodash');
const userRepo = require('../../modules/core/repositories/user');
const createError = require('../utils/create-error');
const tokenUtil = require('../utils/token');

module.exports = async (networkId, token = null) => {
  if (!token) throw createError('401');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  // TODO the user should be retrieved via the service
  const user = await userRepo.findUserById(userId, null, false);

  return {
    credentials: pick(user, 'id', 'username', 'fullName', 'email', 'firstName', 'lastName'),
    artifacts: { integrations },
  };
};
