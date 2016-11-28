import { map } from 'lodash';
import sequelize from 'sequelize';
import createError from '../../../shared/utils/create-error';
import { Team, User, TeamUser } from '../../../shared/models';
import * as userRepo from './user';
import createTeamModel from '../models/team';

const toModel = (dao) => createTeamModel(dao);

export function findTeamById(id) {
  return Team
    .findById(id)
    .then(team => {
      if (!team) throw createError('404', `teamId: ${id}`);

      return team;
    });
}

export const findBy = async (attributes) => {
  return Team.findOne({ where: { ...attributes } });
};

export function addUserToTeams(teamIds, userId) {
  const values = teamIds.map(teamId => ({ teamId, userId }));

  return TeamUser.bulkCreate(values);
}

export function addUserToTeam(teamId, userId) {
  return TeamUser.create({ teamId, userId });
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

  return map(result, toModel);
};

export const findMembers = async (teamId) => {
  const result = await TeamUser.findAll({
    attributes: ['userId'],
    where: { teamId },
  });

  return userRepo.findUsersByIds(map(result, 'userId'));
};

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

export const deleteById = async (teamId) => {
  return Team.destroy({ where: { id: teamId } });
};

export function findUsersByTeamIds(ids) {
  return User
    .findAll({
      include: [{ model: Team }],
      where: sequelize.where(sequelize.col('Teams.id'), { $in: ids }),
    });
}

export const updateTeam = async (teamId, attributes) => {
  const team = await Team.findById(teamId);
  await team.update(attributes);

  return findTeamById(team.id);
};
