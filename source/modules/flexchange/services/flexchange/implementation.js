import { omit, map, filter, find } from 'lodash';
import { UserRoles } from '../../../../shared/services/permission';
import createError from '../../../../shared/utils/create-error';
import * as networkUtil from '../../../../shared/utils/network';
import * as teamRepo from '../../../core/repositories/team';
import * as userRepo from '../../../core/repositories/user';
import * as exchangeRepo from '../../repositories/exchange';

export const matchUsersForShift = async (usersToMatch, network) => {
  const externalIds = map(usersToMatch, 'externalId');
  const matchedUsers = await userRepo.findExternalUsers(externalIds);

  const response = filter(matchedUsers, (u) => !!networkUtil.select(u.Networks, network.id))
    .map((u) => networkUtil.addUserScope(u, network.id));

  return response;
};

export const validateExchangeResponse = (exchangeResponse) => {
  if (exchangeResponse.approved) {
    throw createError('403', 'The user is already approved for the exchange.');
  } else if (exchangeResponse.approved === 0) {
    throw createError('403', 'You cannot approve a user that is rejected for the exchange.');
  } else if (!exchangeResponse.response) {
    throw createError('403', 'You cannot approve a user that did not accept the exchange.');
  }
};

export const filterTeamsForNetwork = (teams, networkId) => teams.
  filter(team => team.networkId === networkId);

export const mergeShiftWithExchangeAndTeam = (shift, exchange, team) => ({
  ...omit(shift, 'team_id'),
  exchangeId: exchange ? exchange.id : null,
  teamId: team ? team.id : null,
});

export const listExchangesForAdmin = async (network, credentials, queryFilter) => {
  return exchangeRepo.findExchangesByNetwork(network.id, credentials.id, queryFilter);
};

export const listExchangesForEmployee = async (network, user, queryFilter) => {
  if (network.hasIntegration) {
    const exchangesForUser = await exchangeRepo.findExchangesForValues(
      'USER', network.id, [user.id], user.id, queryFilter);

    return exchangesForUser;
  }

  const [exchangesInNetwork, exchangesInTeams] = await Promise.all([
    exchangeRepo.findExchangesForValues('ALL', network.id, [network.id], user.id, queryFilter),
    exchangeRepo.findExchangesForValues('TEAM', network.id, user.teamIds, user.id, queryFilter),
  ]);

  return exchangesInNetwork.concat(exchangesInTeams);
};

export const mapShiftsWithExchangeAndTeam = (shifts, exchanges, teams) => {
  const findExchange = (shiftId) => find(exchanges, { shiftId: parseInt(shiftId, 10) });
  const findTeam = (externalId) => find(teams, { externalId });

  return shifts.map(shift => mergeShiftWithExchangeAndTeam(
    shift, findExchange(shift.id), findTeam(shift.team_id))
  );
};
