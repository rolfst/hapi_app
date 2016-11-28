import { uniq, map } from 'lodash';
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
import * as userRepo from './user';

const defaultIncludes = [
  { model: Integration, required: false },
  { model: User, as: 'SuperAdmin' },
];

const toModel = (dao) => createNetworkModel(dao);

export const findAll = async () => {
  const networks = await Network.findAll({
    include: defaultIncludes,
  });

  return map(networks, toModel);
};

export const findNetwork = async (data) => {
  const result = await Network.findOne({
    where: data,
    include: defaultIncludes,
  });

  if (!result) return null;

  return toModel(result);
};

export const findNetworkById = async (id) => {
  const result = await Network.findById(id, {
    include: defaultIncludes,
  });

  if (!result) return null;

  return toModel(result);
};

export const findNetworkByIds = async (ids) => {
  const result = await Network.findAll({
    where: { id: { $in: ids } },
    include: defaultIncludes,
  });

  return map(result, toModel);
};

export const findIntegrationNameForNetwork = async (networkId) => {
  const result = await findNetworkById(networkId);
  if (!result.hasIntegration) return null;

  return result.integrations[0];
};

export const findIntegrationInfo = async (userId) => {
  const result = await NetworkUser.findAll({
    where: { userId, userToken: { $ne: null } },
  });

  return Promise.map(result, async (pivot) => ({
    name: await findIntegrationNameForNetwork(pivot.networkId),
    token: pivot.userToken,
    externalId: pivot.externalId,
  }));
};

export const findNetworkIntegration = async (networkId) => {
  const result = await NetworkIntegration.findOne({ where: { networkId } });

  return result;
};

export const setImportDateOnNetworkIntegration = async (networkId) => {
  const networkIntegration = await findNetworkIntegration(networkId);
  return networkIntegration.update({ importedAt: moment().toISOString() });
};

export const unsetImportDateOnNetworkIntegration = async (networkId) => {
  const networkIntegration = await findNetworkIntegration(networkId);
  return networkIntegration.update({ importedAt: null });
};

export const findIntegrationByName = (name) => {
  return Integration.findOne({ where: { name } });
};

export const findAllContainingUser = async (userId) => {
  const pivotResult = await NetworkUser.findAll({
    where: { userId, deletedAt: null },
  });

  const networkIds = uniq(map(pivotResult, 'networkId'));

  return findNetworkByIds(networkIds);
};

export const activateUserInNetwork = async (network, user, active = true) => {
  const deletedAt = active ? null : new Date();
  const result = await NetworkUser.findOne({
    where: { networkId: network.id, userId: user.id },
  });

  return result.update({ deletedAt });
};

export const setRoleTypeForUser = async (network, user, roleType) => {
  const result = await NetworkUser.findOne({
    where: { networkId: network.id, userId: user.id },
  });

  return result.update({ roleType });
};

export const findNetworksForIntegration = async (integrationName) => {
  const networks = await Network
    .findAll({
      include: [{
        model: User,
        as: 'SuperAdmin',
      }, {
        model: Integration,
        where: { name: integrationName },
      }],
    });

  return map(networks, toModel);
};

export const addUser = async (attributes) => {
  const pivotResult = await NetworkUser.findOne({
    where: { networkId: attributes.networkId, userId: attributes.userId },
  });

  if (pivotResult) return pivotResult.update({ deletedAt: null });

  return NetworkUser.create({ ...attributes, user_id: attributes.userId });
};

export const setSuperAdmin = async (networkId, superUserId) => {
  const network = await Network.findById(networkId);
  const superUser = await userRepo.findUserById(superUserId);
  if (!superUser) throw createError('404');

  return network.update({ userId: superUser.id });
};

export const findUsersForNetwork = async (networkId, roleType = null, invisibleUser = false) => {
  const whereConstraint = { networkId, deletedAt: null, invisibleUser };
  if (roleType) whereConstraint.roleType = roleType;

  const result = await NetworkUser.findAll({
    attributes: ['userId'],
    where: whereConstraint,
  });

  return userRepo.findUsersByIds(map(result, 'userId'));
};

export const findAllUsersForNetwork = async (networkId) => {
  const result = await NetworkUser.findAll({
    attributes: ['userId'],
    where: { networkId },
  });

  return userRepo.findUsersByIds(map(result, 'userId'));
};

export const findTeamsForNetwork = async (networkId) => {
  return Team.findAll({ where: { networkId } });
};

export const addIntegrationToNetwork = async (networkId, integrationId) => {
  const network = await Network.findById(networkId);

  return network.addIntegration(integrationId);
};

export const createNetwork = async (userId, name = null, externalId = null) => {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId,
  });

  return findNetworkById(network.id);
};

export const deleteById = (networkId) => {
  return Network.destroy({ where: { id: networkId } });
};

export const createIntegrationNetwork = async ({
  userId, externalId, name, integrationName,
}) => {
  const network = await createNetwork(userId, name, externalId);
  const integration = await findIntegrationByName(integrationName);

  if (!integration) throw createError('10001', `Integration ${integrationName} not found.`);

  await addIntegrationToNetwork(network.id, integration.id);

  return findNetworkById(network.id);
};
