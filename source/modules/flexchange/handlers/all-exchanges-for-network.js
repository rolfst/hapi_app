import { findExchangesByNetwork } from 'modules/flexchange/repositories/exchange';
import { ExchangeResponse } from 'modules/flexchange/models';
import respondWithCollection from 'common/utils/respond-with-collection';
import hasIntegration from 'common/utils/network-has-integration';
import parseIncludes from 'common/utils/parse-includes';
import _ from 'lodash';

export default async (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // TODO: Execute integration logic with adapter
  }

  const includes = parseIncludes(req.query);
  const modelIncludes = [];

  if (_.includes(includes, 'responses')) modelIncludes.push({ model: ExchangeResponse });

  try {
    const exchanges = await findExchangesByNetwork(req.pre.network, modelIncludes);

    return reply(respondWithCollection(exchanges));
  } catch (err) {
    console.log('Error while fetching exchanges by network', err);
    return reply(err);
  }
};
