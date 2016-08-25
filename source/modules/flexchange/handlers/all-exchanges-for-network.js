import _ from 'lodash';
import { isAdmin, isEmployee } from 'common/services/permission';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';
import {
  findExchangesByNetwork,
  findExchangesForValues,
} from 'modules/flexchange/repositories/exchange';
import { ExchangeResponse, ExchangeComment } from 'modules/flexchange/models';

export default async (req, reply) => {
  const { credentials } = req.auth;
  const includes = parseIncludes(req.query);
  const modelIncludes = [];

  if (_.includes(includes, 'responses')) {
    modelIncludes.push({ model: ExchangeResponse });
  }

  if (_.includes(includes, 'comments')) {
    modelIncludes.push({ model: ExchangeComment, as: 'Comments' });
  }

  try {
    const network = req.pre.network;
    let exchanges;
    const args = [network, credentials.id, modelIncludes, req.query];

    if (isAdmin(credentials)) {
      exchanges = await findExchangesByNetwork.apply(null, args);
    } else if (isEmployee(credentials)) {
      const teamIds = credentials.Teams
        .filter(t => t.networkId === network.id)
        .map(t => t.id);

      const exchangesInNetwork = await findExchangesForValues('ALL', [network.id]);
      const exchangesInTeams = await findExchangesForValues(
        'TEAM', teamIds, credentials.id, modelIncludes, req.query
      );

      exchanges = [...exchangesInNetwork, ...exchangesInTeams];
    }

    return reply(respondWithCollection(exchanges));
  } catch (err) {
    console.log('Error while fetching exchanges by network', err);
    return reply(err);
  }
};
