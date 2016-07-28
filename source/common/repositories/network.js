import Boom from 'boom';
import { Network, User, NetworkUser, Integration } from 'common/models';

const defaultIncludes = [
  { model: Integration, required: false },
  { model: User, as: 'SuperAdmin' },
];

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

export function addUserToNetwork(network, user, roleType) {
  return user.addNetwork(network, { roleType });
}

export function findNetworkById(id) {
  return Network
    .findById(id, {
      include: defaultIncludes,
    })
    .then(network => {
      if (!network) return Boom.notFound(`No network found with id ${id}.`);

      return network;
    });
}

export function findNetwork(data) {
  return Network
    .findOne({ where: data, include: defaultIncludes })
    .then(network => {
      if (!network) return Boom.notFound('No network found for the given data.');

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

export function findAllUsersForNetwork(network) {
  return network.getUsers();
}

export function findAdminsByNetwork(network) {
  return network.getAdmins();
}

export function findTeamsForNetwork(network) {
  return network.getTeams();
}

export async function createNetwork(userId, name = null, externalId = null) {
  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name, userId, enabledComponents, externalId,
  });

  return await findNetworkById(network.id);
}

export async function createPmtNetwork(userId, name = null) {
  const network = await createNetwork(userId, name, 'https://partner2.testpmt.nl/rest.php/dokkum');
  const integration = await findIntegrationByName('PMT');

  await network.setIntegrations([integration]);

  return await findNetworkById(network.id);
}
