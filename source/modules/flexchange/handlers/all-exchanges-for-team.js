import { findTeamById } from 'common/repositories/team';
import { ExchangeResponse, ExchangeComment } from 'modules/flexchange/models';
import { findExchangesByTeam } from 'modules/flexchange/repositories/exchange';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';
import parseIncludes from 'common/utils/parse-includes';
import _ from 'lodash';

export default async (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  const includes = parseIncludes(req.query);
  const modelIncludes = [];

  if (_.includes(includes, 'responses')) {
    modelIncludes.push({ model: ExchangeResponse });
  }

  if (_.includes(includes, 'comments')) {
    modelIncludes.push({ model: ExchangeComment, as: 'Comments' });
  }

  try {
    const team = await findTeamById(req.params.teamId);
    const exchanges = await findExchangesByTeam(team, modelIncludes);

    return reply(respondWithCollection(exchanges));
  } catch (err) {
    console.log('Error while fetching exchanges by team', err);
    return reply(err);
  }
};
