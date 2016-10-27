import { uniq, map } from 'lodash';
import Promise from 'bluebird';
import { Network, Team, User, NetworkUser, Integration } from '../../../shared/models';
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

export function findIntegrationByName(name) {
  return Integration.findOne({ where: { name } });
}

export const findAllContainingUser = async (userId) => {
  const pivotResult = await NetworkUser.findAll({
    where: { userId, deletedAt: null },
  });
  const networkIds = uniq(map(pivotResult, 'networkId'));

  return findNetworkByIds(networkIds);
};

export async function activateUserInNetwork(network, user) {
  const result = await NetworkUser.findOne({
    where: { networkId: network.id, userId: user.id },
  });

  return result.update({ deletedAt: null });
}

export async function setRoleTypeForUser(network, user, roleType) {
  const result = await NetworkUser.findOne({
    where: { networkId: network.id, userId: user.id },
  });

  return result.update({ roleType });
}

export function findNetworksForIntegration(integrationName) {
  return Network
    .findAll({
      include: [{
        model: Integration,
        where: { name: integrationName },
      }],
    });
}

export const addUser = async (attributes) => {
  const pivotResult = await NetworkUser.findOne({
    where: { networkId: attributes.networkId, userId: attributes.userId },
  });

  if (pivotResult) return pivotResult.update({ deletedAt: null });

  return NetworkUser.create({ ...attributes, user_id: attributes.userId });
};

export const findUsersForNetwork = async (networkId, roleType = null) => {
  const whereConstraint = { networkId, deletedAt: null };
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
  return Team.findAll({
    where: { networkId },
  });
};

export const addIntegrationToNetwork = async (networkId, integrationId) => {
  const network = await Network.findById(networkId);

  return network.addIntegration(integrationId);
};

export async function createNetwork(userId, name = null, externalId = null) {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId,
  });

  return findNetworkById(network.id);
}

export const deleteById = (networkId) => {
  return Network.destroy({ where: { id: networkId } });
};

export async function createIntegrationNetwork({
  userId, externalId, name, integrationName,
}) {
  const network = await createNetwork(userId, name, externalId);
  const integration = await findIntegrationByName(integrationName);

  if (!integration) throw createError('10001', `Integration ${integrationName} not found.`);

  await addIntegrationToNetwork(network.id, integration.id);

  return findNetworkById(network.id);
}
