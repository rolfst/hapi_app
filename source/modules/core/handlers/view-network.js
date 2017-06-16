const responseUtil = require('../../../shared/utils/response');

module.exports = async (req, reply) => {
  try {
    return reply({ data: responseUtil.toSnakeCase(req.auth.artifacts.network) });
  } catch (err) {
    return reply(err);
  }
};
