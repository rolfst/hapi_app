import { findExchangesByNetwork } from 'modules/flexchange/repositories/exchange';
import { ExchangeResponse, ExchangeComment } from 'modules/flexchange/models';
import respondWithCollection from 'common/utils/respond-with-collection';
import parseIncludes from 'common/utils/parse-includes';
import _ from 'lodash';

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
    const exchanges = await findExchangesByNetwork(req.pre.network, credentials.id, modelIncludes);

    return reply(respondWithCollection(exchanges));
  } catch (err) {
    console.log('Error while fetching exchanges by network', err);
    return reply(err);
  }
};
