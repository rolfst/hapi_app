import { includes, orderBy } from 'lodash';
import { isAdmin, isEmployee } from 'common/services/permission';
import * as responseUtil from 'common/utils/response';
import parseIncludes from 'common/utils/parse-includes';
import {
  findExchangesByNetwork,
  findExchangesForValues,
} from 'modules/flexchange/repositories/exchange';
import { ExchangeResponse, ExchangeComment } from 'modules/flexchange/models';

export default async (req, reply) => {
  const { credentials } = req.auth;
  const queryIncludes = parseIncludes(req.query);
  const modelIncludes = [];

  if (includes(queryIncludes, 'responses')) {
    modelIncludes.push({ model: ExchangeResponse });
  }

  if (includes(queryIncludes, 'comments')) {
    modelIncludes.push({ model: ExchangeComment, as: 'Comments' });
  }

  try {
    const network = req.pre.network;
    let exchanges;

    if (isAdmin(credentials)) {
      exchanges = await findExchangesByNetwork(
        network, credentials.id, modelIncludes, req.query
      );
    } else if (isEmployee(credentials)) {
      const teamIds = credentials.Teams
        .filter(t => t.networkId === network.id)
        .map(t => t.id);

      const exchangesInNetwork = await findExchangesForValues(
        'ALL', [network.id], credentials.id, modelIncludes, req.query
      );

      const exchangesInTeams = await findExchangesForValues(
        'TEAM', teamIds, credentials.id, modelIncludes, req.query
      );

      exchanges = [...exchangesInNetwork, ...exchangesInTeams];
    }

    const response = orderBy(exchanges, 'date');

    return reply({ data: responseUtil.serialize(response) });
  } catch (err) {
    return reply(err);
  }
};
