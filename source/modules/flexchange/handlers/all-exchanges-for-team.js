import { findTeamById } from 'common/repositories/team';
import { findExchangesByTeam } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  return findTeamById(req.params.teamId)
    .then(team => findExchangesByTeam(team))
    .then(exchanges => reply(respondWithCollection(exchanges)))
    .catch(err => reply(err));
};
