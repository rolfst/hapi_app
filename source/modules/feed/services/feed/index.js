const R = require('ramda');
const Promise = require('bluebird');
const createError = require('../../../../shared/utils/create-error');
const networkService = require('../../../core/services/network');
const userService = require('../../../core/services/user');
const teamService = require('../../../core/services/team');
const objectService = require('../../../core/services/object');
const coreQueries = require('../../../core/repositories/queries');
const impl = require('./implementation');
const { EObjectTypes, EParentTypes, EUserFields } = require('../../../core/definitions');

/**
 * @module modules/feed/services/feed
 */

const logger = require('../../../../shared/services/logger')('FEED/service/feed');

const pluckId = R.pluck('id');
const feedOptions = R.pick(['limit', 'offset', 'include']);

const findUserIdsInObjects = (objects) => R.uniq(R.reduce((acc, object) => {
  let localArray = acc.concat(object.userId);

  if (object.comments) localArray = localArray.concat(R.pluck('userId', object.comments));
  if (object.likes) localArray = localArray.concat(R.pluck('userId', object.likes));

  return localArray;
}, [], objects));

const pickNeededUserFields =
  R.pick([EUserFields.ID, EUserFields.FULL_NAME, EUserFields.PROFILE_IMG]);

const findRelatedUsersForObjects = async (objects) => {
  return R.map(
    pickNeededUserFields,
    await userService.list({ userIds: findUserIdsInObjects(objects) })
  );
};

const findRelatedUsersForObject = (object) => findRelatedUsersForObjects([object]);

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

  const feedItems = await impl.makeFeed(constraint, feedOptions(payload), message);
  const relatedUsers = await findRelatedUsersForObjects(feedItems);

  return { feedItems, relatedUsers };
};

/**
 * Making a feed for an organisation
 * @param {object} payload - Object containing payload data
 * @param {string} payload.organisationId - The id of organisation to include messages for
 * @param {string} payload.include - The sub resources to include
 * @param {number} payload.limit - The limit of the resultset for pagination
 * @param {number} payload.offset - The offset of the resultset for pagination
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method makeForOrganisation
 * @return {external:Promise.<{ count, feedItems }>} {@link module:modules/feed~Object}
 */
const makeForOrganisation = async (payload, message) => {
  logger.debug('Making feed for organisation', { payload, message });

  const options = R.pick(['limit', 'offset', 'include'], payload);

  const constraint = {
    $or: [
      {
        parentType: EParentTypes.ORGANISATION,
        parentId: payload.organisationId,
        organisationId: payload.organisationId,
      },
      {
        parentType: EParentTypes.USER,
        parentId: message.credentials.id,
        objectType: EObjectTypes.ORGANISATION_MESSAGE,
      },
    ],
  };

  const [count, feedItems] = await Promise.all([
    objectService.count({ constraint }, message),
    impl.makeFeed(constraint, options, message),
  ]);

  const relatedUsers = await findRelatedUsersForObjects(feedItems);

  return { count, feedItems, relatedUsers };
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
  const feedItems = await impl.makeFeed(constraint, feedOptions(payload), R.assoc('network', network, message));
  const relatedUsers = await findRelatedUsersForObjects(feedItems);

  return { feedItems, relatedUsers };
};

async function makeForPerson(payload, message) {
  const [networkIds, teamIds] = await Promise.all([
    coreQueries
      .executeQuery(coreQueries.QUERIES.FETCH_ELIGIBLE_NETWORK_IDS, {
        organisationId: payload.organisationId,
        userId: message.credentials.id,
      })
      .then(coreQueries.pluckIds),
    coreQueries
      .executeQuery(coreQueries.QUERIES.FETCH_ELIGIBLE_TEAM_IDS, {
        organisationId: payload.organisationId,
        userId: message.credentials.id,
      })
      .then(coreQueries.pluckIds),
  ]);

  const constraint = {
    $or: [
      {
        parentType: EObjectTypes.ORGANISATION,
        parentId: payload.organisationId,
        organisationId: payload.organisationId,
      },
      {
        parentType: EObjectTypes.NETWORK,
        parentId: { $in: networkIds },
      },
      {
        parentType: EObjectTypes.TEAM,
        parentId: { $in: teamIds },
      },
      {
        parentType: EObjectTypes.USER,
        parentId: message.credentials.id,
        organisationId: payload.organisationId,
      },
    ],
  };

  const totalCountPromise = objectService.count({ constraint }, message);
  const feedPromise = impl.makeFeed(constraint, feedOptions(payload), message);
  const [count, feedItems] = await Promise.all([
    totalCountPromise, feedPromise,
  ]);
  const relatedUsers = await findRelatedUsersForObjects(feedItems);

  return { count, feedItems, relatedUsers };
}

exports.makeForNetwork = makeForNetwork;
exports.makeForPerson = makeForPerson;
exports.makeForOrganisation = makeForOrganisation;
exports.makeForTeam = makeForTeam;
exports.findRelatedUsersForObjects = findRelatedUsersForObjects;
exports.findRelatedUsersForObject = findRelatedUsersForObject;
