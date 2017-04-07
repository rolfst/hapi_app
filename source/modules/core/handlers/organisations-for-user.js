const responseUtil = require('../../../shared/utils/response');
const organisationService = require('../services/organisation');
const createServicePayload = require('../../../shared/utils/create-service-payload');

module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);
    const payload = {
      id: req.auth.credentials.id,
      include: req.query.include ? req.query.include.split(',') : [],
    };
    const data = await organisationService.listForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
