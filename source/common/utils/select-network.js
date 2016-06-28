import _ from 'lodash';

export default function (networks, networkId) {
  const network = _.find(networks, { id: parseInt(networkId, 10) });

  if (!network) throw new Error('User does not belong to this network.');

  return network;
}
