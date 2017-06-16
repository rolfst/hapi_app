const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const authorizationService = require('../../../core/services/authorization');
const { EObjectTypes } = require('../../../core/definitions');
const userService = require('../../../core/services/user');
const objectService = require('../../../core/services/object');

/**
 * Remove objects that are attached to a message. Either as child or as parent.
 * @param {string} messageId - The id of the message
 * @method removeAttachedObjects
 * @return {Promise}
 */
const removeAttachedObjects = (messageId) => objectService.remove({
  $or: [
    { objectType: EObjectTypes.FEED_MESSAGE, sourceId: messageId },
    { objectType: EObjectTypes.ORGANISATION_MESSAGE, sourceId: messageId },
  ],
});

/**
 * Check if the user has permission to view the message
 * @param {string} messageId - The id of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertThatUserBelongsToMessage
 * @throws Error - 404
 */
const assertThatUserBelongsToMessage = async (messageId, message) => {
  const payload = { objectType: 'feed_message', sourceId: messageId };

  const { parentType, parentId } = await objectService.get(payload, message);
  const userId = message.credentials.id;

  try {
    await R.cond([
      [R.equals('network'), () => authorizationService.assertThatUserBelongsToTheNetwork({
        userId, networkId: parentId,
      })],
      [R.equals('team'), () => authorizationService.assertThatUserBelongsToTheTeam({
        userId, teamId: parentId,
      })],
    ])(parentType);
  } catch (err) {
    throw createError('403');
  }
};

const assertThatCurrentOwnerHasUpdateRights = async (objectId, message) => {
  const object = await objectService.get({ id: objectId }, message);
  const objectParent = await objectService
    .getParent(R.pick(['parentType', 'parentId'], object));

  const networkId = R.cond([
    [R.equals('network'), R.always(objectParent.id)],
    [R.equals('team'), R.always(objectParent.networkId)],
  ])(object.parentType);

  const user = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId });

  if (!(user.roleType === 'ADMIN' || object.userId === message.credentials.id)) {
    throw createError('403');
  }
};

exports.assertThatCurrentOwnerHasUpdateRights = assertThatCurrentOwnerHasUpdateRights;
exports.assertThatUserBelongsToMessage = assertThatUserBelongsToMessage;
exports.removeAttachedObjects = removeAttachedObjects;
