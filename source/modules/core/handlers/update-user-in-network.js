const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const networkService = require('../services/network');
const createError = require('../../../shared/utils/create-error');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    if (
      !(await networkService.userHasRoleInNetwork(
        payload.networkId,
        message.credentials.id,
        networkService.ERoleTypes.ADMIN))
    ) {
      throw createError('403');
    }

    const data = await networkService.updateUserInNetwork(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
