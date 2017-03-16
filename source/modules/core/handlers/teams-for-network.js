const R = require('ramda');
const responseUtil = require('../../../shared/utils/response');
const networkService = require('../services/network');

module.exports = async (req, reply) => {
  try {
    const payload = req.params;
    const message = R.merge(req.pre, req.auth);
    const data = await networkService.listTeamsForNetwork(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
