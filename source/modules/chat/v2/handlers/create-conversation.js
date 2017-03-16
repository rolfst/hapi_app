const R = require('ramda');
const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const conversationService = require('../services/conversation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const result = await conversationService.create(payload, message);

    return reply({
      data: responseUtil.toSnakeCase(R.omit(['new'], result)),
      is_new: !!result.new,
    });
  } catch (err) {
    return reply(err);
  }
};
