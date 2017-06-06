const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');
const userService = require('../../core/services/user');
const { EUserFields } = require('../../core/definitions');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const comments = await messageService.listComments(payload, message);

    const retVal = {
      data: comments,
      meta: {
        related: {
          users: R.map(
            R.pick([EUserFields.ID, EUserFields.FULL_NAME, EUserFields.PROFILE_IMG]),
            await userService.list({ userIds: R.pluck('userId', comments) }, message)
          ),
        },
      },
    };

    return reply(responseUtil.toSnakeCase(retVal));
  } catch (err) {
    return reply(err);
  }
};
