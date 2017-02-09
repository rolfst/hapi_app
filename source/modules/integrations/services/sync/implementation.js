import R from 'ramda';
import Promise from 'bluebird';
import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as passwordUtil from '../../../../shared/utils/password';
import * as teamRepository from '../../../core/repositories/team';
import * as userRepository from '../../../core/repositories/user';
import * as networkRepository from '../../../core/repositories/network';

const logger = Logger.createLogger('INTEGRATIONS/service/sync');

const rejectNil = R.reject(R.isNil);
const pluckEmail = R.pluck('email');
const pluckExternalIds = R.pipe(R.pluck('externalId'), rejectNil);
const groupByExternalId = R.pipe(
  R.filter(R.prop('externalId')),
  R.groupBy(R.prop('externalId')),
  R.map(R.head)
);
const groupByEmail = R.pipe(R.groupBy(R.prop('email')), R.map(R.head));
const findDataByExternalId = R.curry((data, externalId) => data[externalId]);
const updateTeams = (networkId, teams) => Promise.map(teams, (team) =>
  teamRepository.update({ externalId: team.externalId, networkId }, R.pick(['name'], team))
    .catch((err) => logger.error('Error updating team', { err })));
const createTeams = (networkId, teams) => Promise.map(teams, (team) =>
  teamRepository.create(R.merge({ networkId }, R.pick(['name', 'externalId'], team)))
    .catch((err) => logger.error('Error creating team', { err })));
const deleteTeams = (teamIds) => Promise.map(teamIds, teamRepository.deleteById);
const mergeAndGroupByExternalId = (internalCollection, externalCollection) =>
  R.merge(groupByExternalId(internalCollection), groupByExternalId(externalCollection));

export const isSyncable = R.and(R.prop('hasIntegration'), R.prop('importedAt'));

export function assertNetworkIsSyncable(network) {
  if (!isSyncable(network)) throw createError('10009');
}

export function assertUserIsAdmin(user) {
  if (!R.propEq('role', 'ADMIN', user)) throw createError('403');
}

/**
 * We build up the actions to be executed by the executeTeamActions function.
 * The output will consist of external ids that can be matched with the lookup
 * in the 'data' property.
 * @param {Team[]} internalTeams - The teams that are currently in our system
 * @param {Team[]} externalTeams - The teams that are fetched from the external system
 * @method createTeamActions
 * @return Returns an object containing the actions to execute.
 */
export const createTeamActions = (internalTeams, externalTeams) => {
  const internalTeamExternalIds = pluckExternalIds(internalTeams);
  const externalTeamExternalIds = pluckExternalIds(externalTeams);

  const externalIdsToAdd = R.difference(externalTeamExternalIds, internalTeamExternalIds);
  const externalIdsToUpdate = R.intersection(internalTeamExternalIds, externalTeamExternalIds);
  const externalIdsToRemove = R.difference(internalTeamExternalIds, externalTeamExternalIds);

  const actions = {
    add: externalIdsToAdd,
    update: externalIdsToUpdate,
    delete: externalIdsToRemove,
    data: mergeAndGroupByExternalId(internalTeams, externalTeams),
  };

  logger.info('Created team actions', { actions: R.omit(['data'], actions) });

  return actions;
};

export const executeTeamActions = (networkId, actions) => {
  const values = R.map(findDataByExternalId(actions.data));
  const internalIds = R.pipe(values, R.pluck('id'), rejectNil);
  const evolvedObj = R.evolve({
    add: (externalIds) => createTeams(networkId, values(externalIds)),
    update: (externalIds) => updateTeams(networkId, values(externalIds)),
    delete: (externalIds) => deleteTeams(internalIds(externalIds)),
  })(actions);

  return Promise.props(evolvedObj);
};

export const createUserActions = (
  allUsersInSystem, internalTeams, _networkUsers, _externalUsers
) => {
  const findTeamById = (id) => R.defaultTo(null, R.find(R.propEq('id', id), internalTeams));
  const networkUsers = R.map(user => {
    const replacedIds = R.map(id => {
      const match = findTeamById(id);

      return match ? match.externalId : null;
    }, R.defaultTo([], user.teamIds));

    return R.assoc('teamIds', rejectNil(replacedIds), user);
  }, _networkUsers);

  const externalUsers = R.map(R.pipe(
    obj => R.assoc('externalTeamIds', R.defaultTo([], obj.teamIds), obj),
    R.dissoc('teamIds')
  ), _externalUsers);

  const groupedNetworkUsers = groupByEmail(networkUsers);
  const groupedExternalUsers = groupByEmail(externalUsers);
  const groupedSystemUser = groupByEmail(allUsersInSystem);
  const externalUserEmails = pluckEmail(externalUsers);
  const networkMatch = (email) => groupedNetworkUsers[email];
  const externalMatch = (email) => groupedExternalUsers[email];
  const systemMatch = (email) => groupedSystemUser[email];
  const isActive = (matchFn) => (email) => R.isNil(R.prop('deletedAt', matchFn(email)));
  const isInactive = (matchFn) => (email) => R.not(R.isNil(R.prop('deletedAt', matchFn(email))));

  const actionReducer = (pred) => R.reduce((acc, value) =>
    R.ifElse(pred, () => R.append(value, acc), R.always(acc))(value), [], externalUserEmails);

  const removePredicate = R.allPass([
    networkMatch,
    isActive(networkMatch),
    isInactive(externalMatch),
  ]);

  const createPredicate = R.allPass([
    R.complement(networkMatch),
    R.complement(systemMatch),
    externalMatch,
  ]);

  const addPredicate = R.ifElse(
    R.both(networkMatch, isActive(externalMatch)),
    R.complement(R.both(isActive(networkMatch), isActive(externalMatch))),
    R.allPass([systemMatch, isActive(externalMatch)])
  );

  const changedTeamsPredicate = R.ifElse(
    networkMatch,
    R.converge(R.complement(R.equals), [
      R.pipe(networkMatch, R.prop('teamIds')),
      R.pipe(externalMatch, R.prop('externalTeamIds')),
    ]),
    R.F
  );

  const createdActions = {
    create: actionReducer(createPredicate),
    add: actionReducer(addPredicate),
    remove: R.concat(
      R.difference(pluckEmail(networkUsers), externalUserEmails),
      actionReducer(removePredicate)
    ),
    changedTeams: actionReducer(changedTeamsPredicate),
    data: R.mergeWith(
      R.merge,
      R.pipe(
        R.filter(user => groupedSystemUser[user.email]),
        groupByEmail
      )(allUsersInSystem), // TODO Big performance impact
      R.mergeWith(
        R.merge,
        R.pipe(R.filter(R.prop('externalId')), groupByEmail)(networkUsers),
        R.pipe(R.filter(R.prop('externalId')), groupByEmail)(externalUsers)
      )
    ),
  };

  logger.info('Created user actions', { actions: R.omit(['data'], createdActions) });

  return createdActions;
};

const setTeamLink = (networkId) => async (user) => {
  // TODO Big performance impact
  const groupedTeams = await R.pipeP(
    networkRepository.findTeamsForNetwork,
    R.filter(R.prop('externalId')),
    groupByExternalId
  )(networkId);

  const getTeams = R.pipe(
    R.map((externalId) => R.defaultTo(null, groupedTeams[externalId])),
    rejectNil
  );

  const teamsToRemove = getTeams(R.difference(user.teamIds, user.externalTeamIds));
  const teamsToAdd = getTeams(R.difference(user.externalTeamIds, user.teamIds));

  const makePromises = (repoFn, errorMessage) => R.map((team) =>
    repoFn(team.id, user.id)
    .catch((err) => logger.error(errorMessage, { networkId, team, user, err })));

  const makeRemovePromises = makePromises(
    teamRepository.removeUserFromTeam, 'Error removing user from team');

  const makeAddPromises = makePromises(
    teamRepository.addUserToTeam, 'Error adding user to team');

  return Promise.all(R.concat(
    makeRemovePromises(teamsToRemove),
    makeAddPromises(teamsToAdd)
  ));
};

const addUser = (networkId) => (user) => userRepository
  .setNetworkLink({ networkId, externalId: user.externalId }, {
    networkId,
    userId: user.id,
    externalId: user.externalId,
    deletedAt: null,
    roleType: user.roleType || 'EMPLOYEE',
  })
  .catch((err) => logger.error('Error creating network link', { networkId, user, err }));

const createUser = (networkId) => (user) => userRepository
  .createUser({
    username: user.email,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNum: user.phoneNum,
    dateOfBirth: user.dateOfBirth,
    password: passwordUtil.plainRandom(),
  })
  .then((createdUser) => addUser(networkId)({ ...user, id: createdUser.id }))
  .then((networkLink) => setTeamLink(networkId)({ ...user, id: networkLink.userId, teamIds: [] }))
  .catch((err) => logger.error('Error creating user', { networkId, user, err }));

const removeUser = (networkId) => (user) => userRepository
  .setNetworkLink({ networkId, externalId: user.externalId }, { deletedAt: new Date() })
  .catch((err) => logger.error('Error removing user from network', { networkId, user, err }));

export const executeUserActions = (networkId, actions) => {
  const values = R.map(email => actions.data[email]);
  const evolvedObj = R.evolve({
    add: (emails) => Promise.map(values(emails), addUser(networkId)),
    create: (emails) => Promise.map(values(emails), createUser(networkId)),
    remove: (emails) => Promise.map(values(emails), removeUser(networkId)),
    changedTeams: (emails) => Promise.map(values(emails), setTeamLink(networkId)),
  })(actions);

  return Promise.props(evolvedObj);
};
