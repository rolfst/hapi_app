import createError from '../utils/create-error';
import { Network, User, NetworkUser, Integration } from 'shared/models';

const defaultIncludes = [
  { model: Integration, required: false },
  { model: User, as: 'SuperAdmin' },
];

export const findAll = async (attributes) => {
  const networks = await Network.findAll({ attributes });
  return networks.map((network) => network.get({ plain: true }));
};

export function findIntegrationByName(name) {
  return Integration.findOne({ where: { name } });
}

export function deleteNetwork(id) {
  return Network.destroy({ where: { id } });
}

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

export function findNetworkById(id) {
  return Network
    .findById(id, {
      include: defaultIncludes,
    })
    .then(network => {
      if (!network) throw createError('404');

      return network;
    });
}

export function findNetwork(data) {
  return Network
    .findOne({ where: data, include: defaultIncludes })
    .then(network => {
      if (!network) throw createError('404');

      return network;
    });
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

export function findActiveUsersForNetwork(network) {
  return network.getUsers();
}

export function findAllUsersForNetwork(network) {
  // TODO: Not working yet, created an issue into the Sequelize github repo
  return network.getUsers();
}

export function findAdminsByNetwork(network) {
  return network.getAdmins();
}

export function findTeamsForNetwork(network) {
  return network.getTeams({
    include: [{ model: User }],
  });
}

export async function createNetwork(userId, name = null, externalId = null) {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId,
  });

  return findNetworkById(network.id);
}

export async function createIntegrationNetwork({
  userId, externalId, name, integrationName,
}) {
  const network = await createNetwork(userId, name, externalId);
  const integration = await findIntegrationByName(integrationName);

  await network.setIntegrations([integration]);

  return findNetworkById(network.id);
}

