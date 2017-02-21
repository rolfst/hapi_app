import R from 'ramda';
import Promise from 'bluebird';
import createError from '../../../../shared/utils/create-error';
import * as pollService from '../../../poll/services/poll';
import * as objectService from '../object';
import * as userService from '../../../core/services/user';
import * as networkService from '../../../core/services/network';
import * as teamService from '../../../core/services/team';

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


export const assertThatCurrentOwnerHasUpdateRights = async (objectId, credentials) => {
  const object = await objectService.get({ objectId });
  const getNetworkFromTeams = async (teams) => networkService.getNetwork(
    { networkId: teams[0].networkId }, { credentials });
  const getNetworkForTeam = async () => {
    const teams = await teamService.list({ teamIds: [object.parentId] }, { credentials });

    return getNetworkFromTeams(teams);
  };
  const network = await R.cond([
    [R.equals('network'), () => networkService.getNetwork(
      { networkId: object.parentId }, { credentials })],
    [R.equals('team'), getNetworkForTeam],
  ])(object.parentType);

  const user = await userService.getUserWithNetworkScope({
    id: credentials.id, networkId: network.id });

  if (user.roleType === 'ADMIN' || object.userId === credentials.id) return;

  throw createError('403');
};
