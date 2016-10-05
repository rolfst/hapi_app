import { omit, map, filter, find } from 'lodash';
import { isAdmin, isEmployee } from '../../../../shared/services/permission';
import createError from '../../../../shared/utils/create-error';
import * as networkUtil from '../../../../shared/utils/network';
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

export const findExchangesForAdmin = async (network, credentials, queryFilter) => {
  return exchangeRepo.findExchangesByNetwork(network, credentials.id, queryFilter);
};

export const findExchangesForEmployee = async (network, credentials, queryFilter) => {
  if (networkUtil.hasIntegration(network)) {
    const exchangesForUser = await exchangeRepo.findExchangesForValues(
      'USER', network.id, [credentials.id], credentials.id, queryFilter);

    return exchangesForUser;
  }

  const teamIds = filterTeamsForNetwork(credentials.Teams, network.id)
    .map(team => team.id);

  const exchangesInNetwork = await exchangeRepo.findExchangesForValues(
      'ALL', network.id, [network.id], credentials.id, queryFilter);

  const exchangesInTeams = await exchangeRepo.findExchangesForValues(
    'TEAM', network.id, teamIds, credentials.id, queryFilter);

  return [...exchangesInNetwork, ...exchangesInTeams];
};

export const findExchangesForUser = async (network, credentials, queryFilter) => {
  let exchanges;

  if (isAdmin(credentials)) {
    exchanges = await findExchangesForAdmin(network, credentials, queryFilter);
  } else if (isEmployee(credentials)) {
    exchanges = await findExchangesForEmployee(network, credentials, queryFilter);
  }

  const createdExchangesByUser = await exchangeRepo.findExchangesByUserAndNetwork(
    credentials, network.id, queryFilter);

  return [...exchanges, ...createdExchangesByUser];
};

export const mapShiftsWithExchangeAndTeam = (shifts, exchanges, teams) => {
  const findExchange = (shiftId) => find(exchanges, { shiftId: parseInt(shiftId, 10) });
  const findTeam = (externalId) => find(teams, { externalId });

  return shifts.map(shift => mergeShiftWithExchangeAndTeam(
    shift, findExchange(shift.id), findTeam(shift.team_id))
  );
};
