import { map } from 'lodash';
import sequelize from 'sequelize';
import Promise from 'bluebird';
import R from 'ramda';
import createTeamModel from '../models/team';
import * as userRepo from './user';
import { Team, User, TeamUser } from './dao';

/**
 * @module modules/core/repositories/team
 */

/**
 * @param {string} id - team id
 * @method findTeamById
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export async function findTeamById(teamId) {
  const result = await Team.findById(teamId, {
    include: [{ attributes: ['id'], model: User }],
  });

  return result ? createTeamModel(result) : null;
}

/**
 * @param {objects} attributes - {@link module:modules/core~Team team attributes}
 * @method findBy
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export const findBy = async (attributes) => {
  return Team.findOne({ where: { ...attributes } });
};

export async function setUsersForTeam(teamId, userIds) {
  const team = await await Team.findById(teamId, {
    include: [{ attributes: ['id'], model: User }],
  });

  await team.setUsers(userIds);

  return R.merge(createTeamModel(team), { memberIds: userIds });
}

/**
 * @param {string} teamIds - team to add the user to
 * @param {string} userId - user to add to the teams
 * @method addUserToTeams
 * @return {external:Promise.<TeamUser[]>} {@link module:modules/core~TeamUser TeamUser}
 */
export function addUserToTeams(teamIds, userId) {
  const values = teamIds.map(teamId => ({ teamId, userId }));

  return TeamUser.bulkCreate(values);
}

/**
 * @param {string} teamId - team to add the user to
 * @param {string} userId - user to add to the team
 * @method addUserToTeam
 * @return {external:Promise.<TeamUser>} {@link module:modules/core~TeamUser TeamUser}
 */
export function addUserToTeam(teamId, userId) {
  return TeamUser.create({ teamId, userId });
}

/**
 * @param {string} teamId - team to add the user to
 * @param {string} userId - user to add to the team
 * @method removeUserFromTeam
 * @return {external:Promise.<number>} number of modified users
 */
export function removeUserFromTeam(teamId, userId) {
  return TeamUser.destroy({
    where: { teamId, userId },
  });
}

export const findTeamsForNetworkThatUserBelongsTo = async (userId, networkId) => {
  const result = await Team.findAll({
    where: { networkId },
    include: [{
      model: User,
      where: { id: userId },
      required: true,
    }],
  });

  return map(result, createTeamModel);
};

/**
 * @param {string} teamId - team to search the user in
 * @method findMembers
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export const findMembers = async (teamId) => {
  const result = await TeamUser.findAll({
    attributes: ['userId'],
    where: { teamId },
  });

  return userRepo.findByIds(map(result, 'userId'));
};

/**
 * @param {string[]} teamIds - Teams to find
 * @method findByIds
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team}
 */
export const findByIds = async (teamIds) => {
  const result = await Team.findAll({
    where: { id: { $in: teamIds } },
    include: [{ attributes: ['id'], model: User }],
  });

  return R.map(createTeamModel, result);
};

/**
 * Finds teams by the provided externalIds. We are passing the networkId because it's
 * possible that the externalId is duplicated. If so, it's possible to return the wrong team.
 * @param {string} networkId - The network id
 * @param {string[]} externalIds - external teamids to search for
 * @method findTeamsByExternalId
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team}
 */
export const findTeamsByExternalId = (networkId, externalIds) => {
  return Team.findAll({
    where: { externalId: { $in: externalIds }, networkId },
  });
};

/**
 * Creates a new team
 * @param {Team} attributes - The team to create
 * @method create
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export async function create(attributes) {
  const team = await Team.create(attributes);

  return createTeamModel(team);
}

/**
 * Creates multiple teams at once
 * @param {Array<Team>} teams - The teams to create
 * @method createBulkTeams
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export function createBulkTeams(teams) {
  return Promise.map(teams, create);
}

/**
 * Verifies if any id in the list of teams is still valid
 * @param {string[]} ids - team ids
 * @param {string} networkId - network the teams belong to
 * @method validateTeamIds
 * @return {external:Promise.<boolean>} - Promise with boolean if all ids are valid
 */
export async function validateTeamIds(ids, networkId) {
  const teamsCount = await Team.count({
    where: {
      id: { $in: ids },
      networkId,
    },
  });

  return teamsCount === ids.length;
}

/**
 * Deletes a team
 * @param {string} teamId - team id
 * @method deleteById
 * @return {external:Promise.<number>} - Promise with the amount of objects deleted
 */
export const deleteById = async (teamId) => {
  return Team.destroy({ where: { id: teamId } });
};

/**
 * Finds users by the provided teamids
 * @param {string[]} ids - teamids to search for users
 * @method findusersbyteamids
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User}
 */
export function findUsersByTeamIds(ids) {
  return User
    .findAll({
      include: [{ model: Team }],
      where: sequelize.where(sequelize.col('Teams.id'), { $in: ids }),
    });
}

/**
 * Updates team attributes
 * @param {string|object} teamIdOrWhereConstraint - Pass id or object containg the constraint
 * @param {object} attributes - {@link module:modules/core~Team team} attributes
 * @method update
 * @return {external:Promise}
 */
export const update = async (teamIdOrWhereConstraint, attributes) => {
  const whereConstraint = (typeof teamIdOrWhereConstraint === 'object') ?
    teamIdOrWhereConstraint : { id: teamIdOrWhereConstraint };

  return Team.update(attributes, { where: whereConstraint });
};
