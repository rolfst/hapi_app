import sequelize from 'sequelize';
import createError from '../../../shared/utils/create-error';
import { Team, User, TeamUser } from '../../../shared/models';

export function findTeamById(id) {
  return Team
    .findById(id)
    .then(team => {
      if (!team) throw createError('404');

      return team;
    });
}

export function addUserToTeams(teamIds, userId) {
  const values = teamIds.map(teamId => ({ teamId, userId }));

  return TeamUser.bulkCreate(values);
}

export function addUserToTeam(team, user) {
  return team.addUser(user);
}

export function findTeamsByIds(ids) {
  return Team
    .findAll({
      where: { id: { $in: ids } },
    });
}

export const findTeamsByExternalId = externalIds => {
  return Team
    .findAll({
      where: { externalId: { $in: externalIds } },
    });
};

export function createTeam({ networkId, name, description = null, externalId }) {
  return Team
    .create({ networkId, name, description, externalId });
}

export function createBulkTeams(teams) {
  return Promise.all(teams.map(team => Team.create(team)));
}

export async function validateTeamIds(ids, networkId) {
  const teamsCount = await Team.count({
    where: {
      id: { $in: ids },
      networkId,
    },
  });

  return teamsCount === ids.length;
}

export function findUsersByTeamIds(ids) {
  return User
    .findAll({
      include: [{ model: Team }],
      where: sequelize.where(sequelize.col('Teams.id'), { $in: ids }),
    });
}
