const R = require('ramda');
const moment = require('moment');
const Sequelize = require('sequelize');
const createError = require('../../../shared/utils/create-error');
const createNetworkModel = require('../models/network');
const createScopedInfoModel = require('../models/network-scope');
const createNetworkLinkModel = require('../models/network-link');
const createUserModel = require('../models/user');
const createTeamModel = require('../models/team');
const userRepo = require('./user');
const { Network,
  Team,
  User,
  NetworkUser,
  Integration,
  NetworkIntegration } = require('./dao');

/**
 * @module modules/core/repositories/network
 */

const defaultIncludes = [
  { model: Integration, required: false },
  { model: User, as: 'SuperAdmin' },
];

/**
 * @method findAll
 * @return {external:Promise.<Network[]>} {@link module:modules/core~Network Network}
 */
const findAll = async () => {
  const networks = await Network.findAll({
    include: defaultIncludes,
  });

  return R.map(createNetworkModel, networks);
};

const findWhere = (whereConstraint) => Network
  .findAll({ include: defaultIncludes, where: whereConstraint })
  .then(R.map(createNetworkModel));

const countsUsersInNetwork = (networkIds, includeDeletedUsers = false) => {
  const whereConstraint = { network_id: { $in: networkIds } };

  if (!includeDeletedUsers) whereConstraint.deleted_at = null;

  return NetworkUser
    .findAll({
      attributes: [
        ['network_id', 'id'],
        [Sequelize.fn('COUNT', 'id'), 'usersCount'],
      ],
      where: whereConstraint,
      group: ['network_id'],
    })
    .then(R.pluck('dataValues'))
    .then(R.map(R.pick(['id', 'usersCount'])));
};

/**
 * @param {Network} data  - partial Network object as search criteria
 * @method findNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
const findNetwork = async (data) => {
  const result = await Network.findOne({
    where: data,
    include: defaultIncludes,
  });

  if (!result) return null;

  return createNetworkModel(result);
};

/**
 * @param {string} id - network id
 * @method findNetworkById
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
const findNetworkById = async (id) => {
  const result = await Network.findById(id, {
    include: defaultIncludes,
  });

  if (!result) return null;

  return createNetworkModel(result);
};

/**
 * @param {string[]} ids - network ids
 * @method findNetworkByIds
 * @return {external:Promise.<Network[]>} {@link module:modules/core~Network Network}
 */
const findNetworkByIds = async (ids) => {
  const result = await Network.findAll({
    where: { id: { $in: ids } },
    include: defaultIncludes,
  });

  return R.map(createNetworkModel, result);
};

const updateNetwork = async (networkId, attributes) => {
  const result = await Network.findOne({
    where: { id: networkId },
  });

  return result.update(attributes);
};

/**
 * @param {string} networkId - network id
 * @method findNetworkIntegration
 * @return {external:Promise.<NetworkIntegration[]>}
 * {@link module:modules/core~NetworkIntegration NetworkIntegration}
 */
const findNetworkIntegration = async (networkId) => NetworkIntegration
  .findOne({ where: { networkId } });

/**
 * @param {string} networkId - network id
 * @method setImportDateOnNetworkIntegration
 * @return {external:Promise.<NetworkIntegration>}
 * {@link module:modules/core~NetworkIntegration NetworkIntegration}
 */
const setImportDateOnNetworkIntegration = async (networkId) => {
  const networkIntegration = await findNetworkIntegration(networkId);
  return networkIntegration.update({ importedAt: moment().toISOString() });
};

/**
 * @param {string} userId - userId
 * @method findNetworksForUser
 * @return {external:Promise.<Integration>} {@link module:modules/core~Integration Integration}
 */
const findNetworksForUser = async (userId, includePivot = false) => {
  const pivotResult = await NetworkUser.findAll({
    where: { userId, deletedAt: null },
  })
  .then(R.map(createNetworkLinkModel));

  if (!includePivot) {
    const networkIds = R.pipe(R.pluck('networkId'), R.uniq)(pivotResult);
    return findNetworkByIds(networkIds);
  }

  const networkResult = await Network
    .findAll({
      where: { id: { $in: R.pluck('networkId', pivotResult) } },
    })
    .then(R.map(createScopedInfoModel));
  const findNetworkPivot = (networkId) => R.find(R.propEq('id', networkId), networkResult);

  return R.map((networkUser) => R.merge(
    networkUser,
    R.pick(['name', 'id', 'organisationId', 'invitedAt', 'createdAt', 'deletedAt'], findNetworkPivot(networkUser.networkId.toString()))
  ), pivotResult);
};

/**
 * @param {object} attributes - attributes
 * @param {string} attributes.networkId - network where user is added to.
 * @param {string} attributes.userId - user to add to the network
 * @method addUser
 * @return {external:Promise.<NetworkUser>} {@link module:shared~NetworkUser NetworkUser}
 */
const addUser = async (attributes) => {
  const pivotResult = await NetworkUser.findOne({
    where: { networkId: attributes.networkId, userId: attributes.userId },
  });

  if (pivotResult) {
    return pivotResult.update(R.merge(attributes, { deletedAt: attributes.deletedAt || null }));
  }
  return NetworkUser.create(R.merge(attributes, { user_id: attributes.userId }));
};

/**
 * @param {object} attributes - attributes
 * @param {string} networkId - network where user is searched in.
 * @param {string} [attributes.roleType=null] - roleType constraint
 * @param {string} [attributes.deletedAt=null] - deletedAt constraint
 * @param {boolean} [attributes.invisibleUser=false] - user to add to the network
 * @method findUsersForNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
const findUsersForNetwork = async (networkId, attributes = {}) => {
  const whereConstraint = {
    networkId,
    deletedAt: attributes.deletedAt || null,
    invisibleUser: attributes.invisibleUser || false,
  };

  if (attributes.roleType) whereConstraint.roleType = attributes.roleType;

  const networkLinks = await NetworkUser
    .findAll({ where: whereConstraint })
    .then(R.map(createNetworkLinkModel));

  const users = await userRepo.findByIds(R.pluck('userId', networkLinks));
  const networkLinkAttrs = R.pick([
    'roleType', 'externalId', 'deletedAt', 'invitedAt', 'userToken']);
  const findLink = (userId) => R.find(R.propEq('userId', userId), networkLinks);
  const mergeWithNetworkLink = (user) =>
    R.merge(user, R.pipe(findLink, networkLinkAttrs)(user.id));

  return R.map(R.pipe(mergeWithNetworkLink, createUserModel), users);
};

/**
 * @param {string} networkId - network where user is searched in.
 * @method findAllUsersForNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
const findAllUsersForNetwork = async (networkId) =>
  findUsersForNetwork(networkId, { deletedAt: { $or: { $ne: null, $eq: null } } });

/**
 * @param {string} networkId - network where user is searched in.
 * @method findTeamsForNetwork
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team}
 */
const findTeamsForNetwork = (networkId) => Team
  .findAll({ where: { networkId }, include: [{ attributes: ['id'], model: User }] })
  .then(R.map(createTeamModel));

/**
 * @param {string} networkId - network where the integration is added to.
 * @param {string} integrationId - integration to be added.
 * @method addIntegrationToNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
const addIntegrationToNetwork = async (networkId, integrationId) => {
  const network = await Network.findById(networkId);

  return network.addIntegration(integrationId);
};

/**
 * @param {string} userId - superAdmin id
 * @param {string} [name] - name of the network
 * @param {string} [externalId] - known identifier for integration partner
 * @method createNetwork
 * @return {external:Promise.<Network[]>} {@link module:modules/core~Network Network}
 */
const createNetwork = async (userId, name = null, externalId = null, organisationId = null) => {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId, organisationId,
  });

  return findNetworkById(network.id);
};

/**
 * @param {string} networkId - network id
 * @method deleteById
 */
const deleteById = (networkId) => {
  return Network.destroy({ where: { id: networkId } });
};

/**
 * @param {string} name - name
 * @method findIntegrationByName
 * @return {external:Promise.<Integration>} {@link module:modules/core~Integration Integration}
 */
const findIntegrationByName = (name) => {
  return Integration.findOne({ where: { name } });
};

/**
 * @param {string} userId - owner of the network
 * @param {string} name - name for the network
 * @param {string} externalId - identifier as known in the integration partner
 * @param {string} integrationName - name of the integration
 * @param {string} [organisationId] - id of the organisation the network belongs to
 * @method createIntegrationNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
const createIntegrationNetwork = async ({
  userId, externalId, name, integrationName, organisationId,
}) => {
  const network = await createNetwork(userId, name, externalId, organisationId);
  const integration = await findIntegrationByName(integrationName);

  if (!integration) throw createError('10001', `Integration ${integrationName} not found.`);

  await addIntegrationToNetwork(network.id, integration.id);

  return findNetworkById(network.id);
};

const removeUser = (networkId, userId) => {
  return NetworkUser.destroy({ where: { networkId, userId } });
};

const updateUser = (networkId, userId, attributes) => {
  const whitelist = ['roleType'];

  return NetworkUser.update(R.pick(whitelist, attributes), { where: { networkId, userId } });
};

const getNetworkUser = (networkId, userId) => {
  return NetworkUser
    .findOne({ where: { networkId, userId } })
    .then((record) => (record ? createNetworkLinkModel(record) : null));
};

exports.addUser = addUser;
exports.addIntegrationToNetwork = addIntegrationToNetwork;
exports.createIntegrationNetwork = createIntegrationNetwork;
exports.createNetwork = createNetwork;
exports.deleteById = deleteById;
exports.findWhere = findWhere;
exports.findAll = findAll;
exports.findAllUsersForNetwork = findAllUsersForNetwork;
exports.findIntegrationByName = findIntegrationByName;
exports.findNetwork = findNetwork;
exports.findNetworkByIds = findNetworkByIds;
exports.findNetworkById = findNetworkById;
exports.findNetworkIntegration = findNetworkIntegration;
exports.findNetworksForUser = findNetworksForUser;
exports.findTeamsForNetwork = findTeamsForNetwork;
exports.findUsersForNetwork = findUsersForNetwork;
exports.getNetworkUser = getNetworkUser;
exports.removeUser = removeUser;
exports.setImportDateOnNetworkIntegration = setImportDateOnNetworkIntegration;
exports.updateNetwork = updateNetwork;
exports.updateUser = updateUser;
exports.countsUsersInNetwork = countsUsersInNetwork;
