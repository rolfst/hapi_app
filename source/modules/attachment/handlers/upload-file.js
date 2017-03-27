const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const attachmentService = require('../services/attachment');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const attachment = await attachmentService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(attachment) });
  } catch (err) {
    console.log('##########33', err);
    return reply(err);
  }
};
