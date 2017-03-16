const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const message = { ...req.auth, ...req.pre };
    const payload = { participants: req.payload.users, type: req.payload.type.toUpperCase() };
    const result = await conversationService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
