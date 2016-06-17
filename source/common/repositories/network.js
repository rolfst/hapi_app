import Boom from 'boom';
import { Network, Integration } from 'common/models';

export function findIntegrationByName(name) {
  return Integration.findOne({ where: { name } });
}

export function deleteNetwork(id) {
  return Network.destroy({ where: { id } });
}

export function findNetworkById(id) {
  return Network
    .findById(id, {
      include: [{ model: Integration, required: false }],
    })
    .then(network => {
      if (!network) return Boom.notFound(`No network found with id ${id}.`);

      return network;
    });
}

export function findNetwork(data) {
  return Network
    .findOne({ where: data, include: [{ model: Integration, required: false }] })
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

export function findAllUsersForNetwork(id) {
  return findNetworkById(id)
    .then(network => network.getUsers());
}

export async function createNetwork(userId, name = null, externalId = null) {
  const networkName = name !== null ? name : `test-network-${Math.floor(Math.random() * 1000)}`;

  const enabledComponents = "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']";
  const network = await Network.create({
    name: networkName, userId, enabledComponents, externalId,
  });

  return await findNetworkById(network.id);
}

export async function createPmtNetwork(userId) {
  const network = await createNetwork(userId, null, 'https://partner2.testpmt.nl/rest.php/dokkum');
  const integration = await findIntegrationByName('PMT');

  await network.setIntegrations([integration]);

  return await findNetworkById(network.id);
}
