import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      //
    }

    console.log('ok');
    console.log(req.auth.credentials.user);

    reply('ok');
  });
}
