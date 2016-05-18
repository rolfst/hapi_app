import { findNetworkById } from 'common/repositories/network';
import { findTeamById } from 'common/repositories/team';
import { findExchangesByTeam } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';
import respondWithCollection from 'common/utils/respond-with-collection';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    findTeamById(req.params.teamId)
      .then(team => findExchangesByTeam(team))
      .then(exchanges => reply(respondWithCollection(exchanges)))
      .catch(err => reply(err));
  });
};
