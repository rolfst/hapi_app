const responseUtil = require('../../../../shared/utils/response');
const privateMessageService = require('../services/private-message');

module.exports = async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const result = await privateMessageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
