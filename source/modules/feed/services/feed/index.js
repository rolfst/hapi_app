import R from 'ramda';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as networkService from '../../../core/services/network';
import * as teamService from '../../../core/services/team';
import * as impl from './implementation';

/**
 * @module modules/feed/services/feed
 */

const logger = Logger.getLogger('FEED/service/feed');
const pluckId = R.pluck('id');
const feedOptions = R.pick(['limit', 'offset', 'include']);

/**
 * Making a feed for a network
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of network to create feed for
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method makeForNetwork
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const makeForNetwork = async (payload, message) => {
  logger.info('Making feed for network', { payload, message });

  const teams = await networkService.listTeamsForNetwork({
    networkId: payload.networkId }, message);

  const extraWhereConstraint = [{
    parentId: { $in: R.pipe(R.filter(R.prop('isMember')), pluckId)(teams) },
    parentType: 'team',
  }, {
    parentType: 'user',
    parentId: message.credentials.id,
  }];

  const feedPayload = { parentType: 'network', parentId: payload.networkId };

  return impl.makeFeed(feedPayload, feedOptions(payload), message, extraWhereConstraint);
};

/**
 * Making a feed for a team
 * @param {object} payload - Object containing payload data
 * @param {string} payload.teamId - The id of team to create feed for
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method makeForTeam
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
export const makeForTeam = async (payload, message) => {
  logger.info('Making feed for team', { payload, message });

  const team = await teamService.get({ teamId: payload.teamId }, message);
  if (R.not(team.isMember)) throw createError('403');

  const network = await networkService.get({ networkId: team.networkId }, message);
  const feedPayload = { parentType: 'team', parentId: payload.teamId };

  return impl.makeFeed(feedPayload, feedOptions(payload), R.assoc('network', network, message));
};
