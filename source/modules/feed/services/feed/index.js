const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const networkService = require('../../../core/services/network');
const userService = require('../../../core/services/user');
const teamService = require('../../../core/services/team');
const impl = require('./implementation');
const { EObjectTypes } = require('../../../core/definitions');

/**
 * @module modules/feed/services/feed
 */

const logger = require('../../../../shared/services/logger')('FEED/service/feed');

const pluckId = R.pluck('id');
const feedOptions = R.pick(['limit', 'offset', 'include']);

/**
 * Making a feed for a network
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of network to create feed for
 * @param {string} payload.organisationId - The id of organisation to include messages for
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method makeForNetwork
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
const makeForNetwork = async (payload, message) => {
  logger.debug('Making feed for network', { payload, message });

  const [user, teams] = await Promise.all([
    userService.getUserWithNetworkScope({
      id: message.credentials.id, networkId: payload.networkId }, message),
    networkService.listTeamsForNetwork({ networkId: payload.networkId }, message),
  ]);

  const filterTeams = (user.roleType === 'ADMIN') ? R.always(teams) : R.filter(R.prop('isMember'));

  const extraWhereConstraint = [{
    parentId: { $in: R.pipe(filterTeams, pluckId)(teams) },
    parentType: EObjectTypes.TEAM,
  }, {
    parentType: EObjectTypes.USER,
    parentId: message.credentials.id,
  }, {
    parentType: EObjectTypes.ORGANISATION,
    parentId: payload.organisationId,
  }];

  const feedPayload = {
    networkId: payload.networkId,
    parentType: EObjectTypes.NETWORK,
    parentId: payload.networkId,
  };
  const constraint = impl.composeSpecialisedQueryForFeed(feedPayload, extraWhereConstraint);
  return impl.makeFeed(constraint, feedOptions(payload), message);
};

/**
 * Making a feed for a network
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of network to create feed for
 * @param {string} payload.organisationId - The id of organisation to include messages for
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method makeForOrganisation
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
const makeForOrganisation = async (payload, message) => {
  logger.debug('Making feed for organisation', { payload, message });

  const feedPayload = {
    parentType: EObjectTypes.ORGANISATION,
    parentId: payload.organisationId,
    organisationId: payload.organisationId,
  };
  const options = R.pick(['limit', 'offset', 'include'], payload);

  return impl.makeFeed(feedPayload, options, message);
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
const makeForTeam = async (payload, message) => {
  logger.debug('Making feed for team', { payload, message });

  const team = await teamService.get({ teamId: payload.teamId }, message);
  const user = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: team.networkId }, message);

  if (R.not(team.isMember) && user.roleType !== 'ADMIN') throw createError('403');

  const network = await networkService.get({ networkId: team.networkId }, message);
  const feedPayload = {
    networkId: team.networkId,
    parentType: EObjectTypes.TEAM,
    parentId: payload.teamId,
  };

  const constraint = impl.composeSpecialisedQueryForFeed(feedPayload);
  return impl.makeFeed(constraint, feedOptions(payload), R.assoc('network', network, message));
};

exports.makeForNetwork = makeForNetwork;
exports.makeForOrganisation = makeForOrganisation;
exports.makeForTeam = makeForTeam;
