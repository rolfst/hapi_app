import { omit, map, filter, find } from 'lodash';
import * as networkUtil from '../../../../common/utils/network';
import * as userRepo from '../../../../common/repositories/user';

export const matchUsersForShift = async (usersToMatch, network) => {
  const externalIds = map(usersToMatch, 'externalId');
  const matchedUsers = await userRepo.findExternalUsers(externalIds);

  const response = filter(matchedUsers, (u) => u)
    .map((u) => networkUtil.addUserScope(u, network.id));

  return response;
};

export const mergeShiftWithExchangeAndTeam = (shift, exchange, team) => ({
  ...omit(shift, 'team_id'),
  exchangeId: exchange ? exchange.id : null,
  teamId: team ? team.id : null,
});

export const mapShiftsWithExchangeAndTeam = (shifts, exchanges, teams) => {
  const findExchange = (shiftId) => find(exchanges, { shiftId: parseInt(shiftId, 10) });
  const findTeam = (externalId) => find(teams, { externalId });

  return shifts.map(shift => mergeShiftWithExchangeAndTeam(
    shift, findExchange(shift.id), findTeam(shift.team_id))
  );
};
