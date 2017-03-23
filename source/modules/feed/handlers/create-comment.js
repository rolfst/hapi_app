const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const commentService = require('../services/comment');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.userId = req.auth.credentials.id;
    const likes = await commentService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(likes) });
  } catch (err) {
    return reply(err);
  }
};
