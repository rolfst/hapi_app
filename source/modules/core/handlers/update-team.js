const R = require('ramda');
const responseUtil = require('../../../shared/utils/response');
const teamService = require('../services/team');

module.exports = async (req, reply) => {
  try {
    const payload = R.merge(req.params, req.payload);
    const message = R.merge(req.pre, req.auth);
    const data = await teamService.update(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
