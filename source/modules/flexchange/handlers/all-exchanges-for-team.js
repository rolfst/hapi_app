import { findTeamById } from 'common/repositories/team';
import { ExchangeResponse, ExchangeComment } from 'modules/flexchange/models';
import { findExchangesByTeam } from 'modules/flexchange/repositories/exchange';
import * as responseUtil from 'common/utils/response';
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
    const team = await findTeamById(req.params.teamId);
    const args = [team, credentials.id, modelIncludes, req.query];
    const exchanges = await findExchangesByTeam.apply(null, args);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
