import { findTeamById } from 'common/repositories/team';
import { findExchangesByTeam } from 'modules/flexchange/repositories/exchange';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  const { credentials } = req.auth;

  try {
    const team = await findTeamById(req.params.teamId);
    const exchanges = await findExchangesByTeam(team, credentials.id, req.query);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
