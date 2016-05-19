import Boom from 'boom';
import { Network, Integration } from 'common/models';

export function findNetworkById(id) {
  return Network
    .findById(id, { include: Integration })
    .then(network => {
      if (!network) return Boom.notFound(`No network found with id ${id}.`);

      return network;
    });
}

export function findNetwork(data) {
  return Network
    .findOne({ where: data, include: Integration })
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
