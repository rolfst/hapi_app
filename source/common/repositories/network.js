import Boom from 'boom';
import { Network, Integration } from 'common/models';

export function findNetworkById(id) {
  return Network
    .findById(id)
    .then(network => {
      if (!network) return Boom.notFound('No network found.');

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
    .then(network => network.getUsers())
    .catch(err => console.log(err));
}
