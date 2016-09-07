import { orderBy } from 'lodash';
import { isAdmin, isEmployee } from 'common/services/permission';
import * as responseUtil from 'common/utils/response';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';

export default async (req, reply) => {
  const { credentials } = req.auth;

  try {
    const network = req.pre.network;
    let exchanges;

    if (isAdmin(credentials)) {
      exchanges = await exchangeRepo.findExchangesByNetwork(
        network, credentials.id, req.query
      );
    } else if (isEmployee(credentials)) {
      const teamIds = credentials.Teams
        .filter(t => t.networkId === network.id)
        .map(t => t.id);

      const exchangesInNetwork = await exchangeRepo.findExchangesForValues(
        'ALL', [network.id], credentials.id, req.query
      );

      const exchangesInTeams = await exchangeRepo.findExchangesForValues(
        'TEAM', teamIds, credentials.id, req.query
      );

      exchanges = [...exchangesInNetwork, ...exchangesInTeams];
    }

    const response = orderBy(exchanges, 'date');

    return reply({ data: responseUtil.serialize(response) });
  } catch (err) {
    return reply(err);
  }
};
