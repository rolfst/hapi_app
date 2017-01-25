import { uniq, map } from 'lodash';
import R from 'ramda';
import Promise from 'bluebird';
import moment from 'moment';
import { Network,
  Team,
  User,
  NetworkUser,
  Integration,
  NetworkIntegration } from '../../../shared/models';
import createError from '../../../shared/utils/create-error';
import createNetworkModel from '../models/network';
import createNetworkLinkModel from '../models/network-link';
import createUserModel from '../models/user';
import createTeamModel from '../models/team';
import * as userRepo from './user';

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
export const findAll = async () => {
  const networks = await Network.findAll({
    include: defaultIncludes,
  });

  return map(networks, createNetworkModel);
};

/**
 * @param {Network} data  - partial Network object as search criteria
 * @method findNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
export const findNetwork = async (data) => {
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
export const findNetworkById = async (id) => {
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
export const findNetworkByIds = async (ids) => {
  const result = await Network.findAll({
    where: { id: { $in: ids } },
    include: defaultIncludes,
  });

  return map(result, createNetworkModel);
};

export const updateNetwork = async (networkId, attributes) => {
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
export const findNetworkIntegration = async (networkId) => {
  const result = await NetworkIntegration.findOne({ where: { networkId } });

  return result;
};

/**
 * @param {string} networkId - network id
 * @method setImportDateOnNetworkIntegration
 * @return {external:Promise.<NetworkIntegration>}
 * {@link module:modules/core~NetworkIntegration NetworkIntegration}
 */
export const setImportDateOnNetworkIntegration = async (networkId) => {
  const networkIntegration = await findNetworkIntegration(networkId);
  return networkIntegration.update({ importedAt: moment().toISOString() });
};

/**
 * @param {string} userId - userId
 * @method findNetworksForUser
 * @return {external:Promise.<Integration>} {@link module:modules/core~Integration Integration}
 */
export const findNetworksForUser = async (userId) => {
  const pivotResult = await NetworkUser.findAll({
    where: { userId, deletedAt: null },
  });

  const networkIds = uniq(map(pivotResult, 'networkId'));

  return findNetworkByIds(networkIds);
};

/**
 * @param {object} attributes - attributes
 * @param {string} attributes.networkId - network where user is added to.
 * @param {string} attributes.userId - user to add to the network
 * @method addUser
 * @return {external:Promise.<NetworkUser>} {@link module:modules/core~NetworkUser NetworkUser}
 */
export const addUser = async (attributes) => {
  const pivotResult = await NetworkUser.findOne({
    where: { networkId: attributes.networkId, userId: attributes.userId },
  });

  if (pivotResult) {
    return pivotResult.update({ ...attributes, deletedAt: attributes.deletedAt || null });
  }

  return NetworkUser.create({ ...attributes, user_id: attributes.userId });
};

/**
 * @param {object} attributes - attributes
 * @param {string} attributes.networkId - network where user is searched in.
 * @param {string} [attributes.roleType=null] - roleType constraint
 * @param {string} [attributes.deletedAt=null] - deletedAt constraint
 * @param {boolean} [attributes.invisibleUser=false] - user to add to the network
 * @method findUsersForNetwork
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const findUsersForNetwork = async (attributes) => {
  const whereConstraint = {
    networkId: attributes.networkId,
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
export const findAllUsersForNetwork = async (networkId) =>
  findUsersForNetwork({ networkId, deletedAt: { $or: { $ne: null, $eq: null } } });

/**
 * @param {string} networkId - network where user is searched in.
 * @method findTeamsForNetwork
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team}
 */
export const findTeamsForNetwork = async (networkId) => {
  return Promise.map(Team.findAll({
    where: { networkId },
    include: [{ attributes: ['id'], model: User }],
  }), createTeamModel);
};

/**
 * @param {string} networkId - network where the integration is added to.
 * @param {string} integrationId - integration to be added.
 * @method addIntegrationToNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
export const addIntegrationToNetwork = async (networkId, integrationId) => {
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
export const createNetwork = async (userId, name = null, externalId = null) => {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId,
  });

  return findNetworkById(network.id);
};

/**
 * @param {string} networkId - network id
 * @method deleteById
 */
export const deleteById = (networkId) => {
  return Network.destroy({ where: { id: networkId } });
};

/**
 * @param {string} name - name
 * @method findIntegrationByName
 * @return {external:Promise.<Integration>} {@link module:modules/core~Integration Integration}
 */
export const findIntegrationByName = (name) => {
  return Integration.findOne({ where: { name } });
};

/**
 * @param {string} userId - owner of the network
 * @param {string} externalId - identifier as known in the integration partner
 * @param {string} [name] - name for the network
 * @param {string} integrationName - name of the integration
 * @method createIntegrationNetwork
 * @return {external:Promise.<Network>} {@link module:modules/core~Network Network}
 */
export const createIntegrationNetwork = async ({
  userId, externalId, name, integrationName,
}) => {
  const network = await createNetwork(userId, name, externalId);
  const integration = await findIntegrationByName(integrationName);

  if (!integration) throw createError('10001', `Integration ${integrationName} not found.`);

  await addIntegrationToNetwork(network.id, integration.id);

  return findNetworkById(network.id);
};
