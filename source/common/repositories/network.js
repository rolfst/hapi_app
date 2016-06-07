import Boom from 'boom';
import { Network, Integration } from 'common/models';

export function createNetwork(userId, name = null) {
  let networkName = name;
  if (!name) networkName = `test-network-${Math.floor(Math.random() * 1000)}`;

  return Network
    .create({
      name: networkName,
      userId,
      enabledComponents: "['SOCIAL', 'SCHEDULE', 'CHAT', 'FLEXCHANGE']",
    });
}

export function deleteNetwork(id) {
  return Network.destroy({ where: { id } });
}

export function findNetworkById(id) {
  return Network
    .findById(id, {
      include: [{ model: Integration }],
    })
    .then(network => {
      if (!network) return Boom.notFound(`No network found with id ${id}.`);

      return network;
    });
}

export function findNetwork(data) {
  return Network
    .findOne({ where: data, include: [{ model: Integration }] })
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
