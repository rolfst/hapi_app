import { map, filter, find } from 'lodash';
import * as networkUtil from '../../../../common/utils/network';
import * as userRepo from '../../../../common/repositories/user';

export const matchUsersForShift = async (usersToMatch, network) => {
  const externalIds = map(usersToMatch, 'externalId');
  const matchedUsers = await userRepo.findExternalUsers(externalIds);

  const response = filter(matchedUsers, (u) => u)
    .map((u) => networkUtil.addUserScope(u, network.id));

  return response;
};

export const mergeShiftWithExchange = (shift, exchange) => ({
  ...shift,
  exchangeId: exchange ? exchange.id.toString() : null,
  teamId: exchange ? exchange.teamId.toString() : null,
});

export const mapShiftsWithExchanges = (shifts, exchanges) => {
  const findExchange = (shiftId) => find(exchanges, { shiftId: parseInt(shiftId, 10) });

  return shifts.map(shift => mergeShiftWithExchange(shift, findExchange(shift.id)));
};
