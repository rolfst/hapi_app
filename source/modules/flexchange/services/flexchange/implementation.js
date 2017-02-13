import { omit, map, filter, find } from 'lodash';
import R from 'ramda';
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

export const getExchangeIdsForEmployee = async (network, user, queryFilter) => {
  if (network.hasIntegration) {
    const exchangesForUser = await exchangeRepo.findExchangeIdsForValues(
      'USER', network.id, [user.id], user.id, queryFilter);

    return exchangesForUser;
  }

  const [exchangesInNetwork, exchangesInTeams] = await Promise.all([
    exchangeRepo.findExchangeIdsForValues('ALL', network.id, [network.id], user.id, queryFilter),
    exchangeRepo.findExchangeIdsForValues('TEAM', network.id, user.teamIds, user.id, queryFilter),
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

export const groupValuesPerExchange = (exchangeValues) => {
  const groupByExchangeId = R.groupBy(R.prop('exchangeId'));
  const toPair = R.mapObjIndexed((value, key) => ({
    exchangeId: key,
    values: R.uniq(R.pluck('value', value)),
  }));

  return R.pipe(groupByExchangeId, toPair, R.values)(exchangeValues);
};

export const createResponseStatus = (exchangeResponse) => {
  if (!exchangeResponse) return null;

  const accepted = R.propEq('response', true);
  const declined = R.propEq('response', false);
  const approved = R.propEq('isApproved', true);
  const rejected = R.propEq('isApproved', false);
  const waitingForApproval = R.propEq('isApproved', null);

  return R.cond([
    [R.both(accepted, waitingForApproval), R.always('ACCEPTED')],
    [R.both(declined, waitingForApproval), R.always('DECLINED')],
    [R.both(accepted, approved), R.always('APPROVED')],
    [R.both(accepted, rejected), R.always('REJECTED')],
    [R.T, R.always(null)],
  ])(exchangeResponse);
};

const networkType = (exchange) => ({ type: 'network', id: exchange.values[0] || null });
const teamType = (exchange) => ({ type: 'team', ids: exchange.values });
const shiftType = (exchange) => ({ type: 'team', ids: exchange.teamId ? [exchange.teamId] : null });

export const makeCreatedInObject = R.cond([
  [R.propEq('createdFor', 'ALL'), networkType],
  [R.propEq('createdFor', 'TEAM'), teamType],
  [R.and(
    R.propEq('createdFor', 'USER'),
    R.complement(R.propEq('shiftId', null))
  ), shiftType],
  [R.and(
    R.propEq('createdFor', 'USER'),
    R.propEq('shiftId', null)
  ), networkType],
  [R.T, networkType],
]);

export const createDateWhereConstraint = (start, end) => {
  let dateFilter;

  if (start && end) {
    dateFilter = { $between: [start, end] };
  } else if (start && !end) {
    dateFilter = { $gte: start };
  }

  return dateFilter ? { date: dateFilter } : {};
};

export const addValues = R.curry((valuesLookup, exchange) => {
  const lookup = R.find(R.propEq('exchangeId', exchange.id), valuesLookup);

  return R.merge(exchange, { values: lookup ? lookup.values : [] });
});

export const getUserIdsInObjects = (selectedProperties) => R.pipe(
  R.juxt(R.map(R.pluck, selectedProperties)),
  R.flatten,
  R.uniq,
  R.reject(R.isNil)
);

export const findUserById = R.curry((users, id) => {
  const match = R.find(R.propEq('id', id), users);

  return R.ifElse(R.isNil,
    R.always(null),
    R.pick(['type', 'id', 'fullName', 'profileImg'])
  )(match);
});

export const replaceUsersInResponses = (users, responses) => {
  const userById = findUserById(users);

  return R.map(response => R.merge(response, {
    user: userById(response.userId),
  }), responses);
};
