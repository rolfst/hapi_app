import _ from 'lodash';

export default function (networks, networkId) {
  return _.find(networks, { id: parseInt(networkId, 10) });
}
