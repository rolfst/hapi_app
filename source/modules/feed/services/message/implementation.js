import R from 'ramda';
import Promise from 'bluebird';
import createError from '../../../../shared/utils/create-error';
import * as pollService from '../../../poll/services/poll';
import * as networkImpl from '../../../core/services/network/implementation';
import * as teamImpl from '../../../core/services/team/implementation';
import * as userService from '../../../core/services/user';
import * as objectService from '../object';

/**
 * Creates a poll resource that consists of a poll object and a object object.
 * @param {Message} createdMessage - The message where the poll is created for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createPollResource
 * @return {external:Promise.<Object>}
 */
export const createPollResource = (createdMessage, message) => R.pipeP(
  (pollResource) => pollService.create({
    networkId: message.network.id,
    options: pollResource.options,
  }, message),
  (createdPoll) => objectService.create({
    userId: message.credentials.id,
    parentType: 'feed_message',
    parentId: createdMessage.id,
    objectType: 'poll',
    sourceId: createdPoll.id,
  }, message)
);

/**
 * Remove objects that are attached to a message. Either as child or as parent.
 * @param {string} messageId - The id of the message
 * @method removeAttachedObjects
 * @return {Promise}
 */
export const removeAttachedObjects = (messageId) => Promise.all([
  objectService.remove({ objectType: 'feed_message', sourceId: messageId }),
  objectService.remove({ parentType: 'feed_message', parentId: messageId }),
]);

/**
 * Check if the user has permission to view the message
 * @param {string} messageId - The id of the message
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertThatUserBelongsToMessage
 * @throws Error - 404
 */
export const assertThatUserBelongsToMessage = async (messageId, message) => {
  const payload = { objectType: 'feed_message', sourceId: messageId };

  const { parentType, parentId } = await objectService.get(payload, message);
  const userId = message.credentials.id;

  try {
    const assertionFn = R.cond([
      [R.equals('network'), () => networkImpl.assertThatUserBelongsToTheNetwork],
      [R.equals('team'), () => teamImpl.assertThatUserBelongsToTheTeam],
    ])(parentType);

    await assertionFn(parentId, userId);
  } catch (err) {
    throw createError('403');
  }
};

export const assertThatCurrentOwnerHasUpdateRights = async (objectId, message) => {
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
