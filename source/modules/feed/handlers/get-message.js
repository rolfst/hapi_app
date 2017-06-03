const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');
const userService = require('../../core/services/user');
const { EUserFields } = require('../../core/definitions');

const findUserIdsInObjects = (objects) => R.uniq(R.reduce((acc, object) => {
  let localArray = acc.concat(object.userId);

  if (object.comments) localArray = localArray.concat(R.pluck('userId', object.comments));
  if (object.likes) localArray = localArray.concat(R.pluck('userId', object.likes));

  return localArray;
}, [], objects));

const pickNeededUserFields =
  R.pick([EUserFields.ID, EUserFields.FULL_NAME, EUserFields.PROFILE_IMG]);

const findRelatedUsersForObjects = async (objects) => R.map(
  pickNeededUserFields,
  await userService.list({ userIds: findUserIdsInObjects(objects) })
);

const findRelatedUsersForObject = (object) => findRelatedUsersForObjects([object]);

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.include = req.query.include ? req.query.include.split(',') : [];
    const feedItem = await messageService.getAsObject(payload, message);
    const relatedUsers = await findRelatedUsersForObject(feedItem);

    return reply({
      data: responseUtil.toSnakeCase(feedItem),
      meta: {
        related: {
          users: responseUtil.toSnakeCase(relatedUsers),
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
