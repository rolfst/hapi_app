const responseUtil = require('../../../shared/utils/response');
const networkService = require('../services/network');

export default async (req, reply) => {
  try {
    const payload = { ...req.params };
    const message = { ...req.pre, ...req.auth };
    const data = await networkService.listTeamsForNetwork(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
